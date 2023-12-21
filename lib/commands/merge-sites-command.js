const commander = require("commander");
const ora = require("ora");

const thingiverse = require("../sites/thingiverse");
const cults3d = require("../sites/cults");
const printable = require("../sites/printable");

const util = require("../util");
const constants = require("../constants");

function getCommand() {
    // Create merge sites command
    return new commander.Command("mergeSites")
        .description("Get list of user's Thingiverse designs and match them with designs from cults3d and printable")
        .option("-c, --config <configFile>", "config file path", "config/.env")
        .option("-b, --baseDirectory <baseDirectory>", "base directory for the result files. Export and error directories will be created", "data")
        .action(handler);
}

/**
 * Execute the merge sites command logic
 * 
 * @param {*} options Commander options containing e.g. config file path
 */
async function handler(options) {
    // initialize spinner
    let spinner = ora("Loading configuration").start();

    // load config into environment variables
    const configResult = util.loadConfiguration(options.config);
    if (!configResult.ok) {
        // set spinner to failed
        spinner.fail("Failed to load configuration");
        // let commander exit the process with an error
        commander.error(configResult.error);
    }

    // environment variables are loaded, set spinner to success
    spinner.succeed("Configuration loaded");

    // get the list of user's designs from thingiverse
    spinner = ora("Loading user's Thingiverse designs").start();

    const thingiverseResult = await thingiverse.getDesigns();
    if (!thingiverseResult.ok) {
        // set spinner to failed
        spinner.fail("Failed to load user's Thingiverse designs. Error: " + thingiverseResult.error);
        // let commander exit the process with an error
        commander.error(thingiverseResult.error);
    }

    // set spinner to success
    spinner.succeed("User's Thingiverse designs loaded. Found " + thingiverseResult.data.length + " designs");

    // get the list of designs from cults3d
    spinner = ora("Loading designs from Cults3d").start();

    const cults3dResult = await cults3d.getDesigns();
    if (!cults3dResult.ok) {
        // set spinner to failed
        spinner.fail("Failed to load designs from Cults3d. Error: " + cults3dResult.error);
        // let commander exit the process with an error
        commander.error(cults3dResult.error);
    }

    // set spinner to success
    spinner.succeed("Designs from Cults3d loaded. Found " + cults3dResult.data.length + " designs");

    // get the list of designs from printable
    spinner = ora("Loading designs from Printable").start();

    const printableResult = await printable.getDesigns();
    if (!printableResult.ok) {
        // set spinner to failed
        spinner.fail("Failed to load designs from printable. Error: " + printableResult.error);
        // let commander exit the process with an error
        commander.error(printableResult.error);
    }

    // set spinner to success
    spinner.succeed("Designs from Printable loaded. Found " + printableResult.data.length + " designs");

    // dirty test code. use this instead of the above code to test the merge function
    // let thingiverseResult = await util.readJsonFile("test/mergeSites", "thingiverse-list.json");
    // let cults3dResult = await util.readJsonFile("test/mergeSites", "cults3d-list.json");
    // let printableResult = await util.readJsonFile("test/mergeSites", "printable-list.json");

    // initialize processing status for all site lists. this is needed to determine which designs are merged and which are not
    thingiverseResult.data = initializeProcessingStatus(thingiverseResult.data);
    cults3dResult.data = initializeProcessingStatus(cults3dResult.data);
    printableResult.data = initializeProcessingStatus(printableResult.data);

    // initialize merged list
    let mergedDesigns = [];

    // iterate over thingiverse designs and find matching designs from cults3d and printable by title
    for (let i = 0; i < thingiverseResult.data.length; i++) {
        // current thingiverse design
        const thingiverseDesign = thingiverseResult.data[i];

        // initialize current merged design
        let mergedDesign = { title: thingiverseDesign.title, sources: [] };

        // find matching design in cults3d by title
        let cultsIndex = cults3dResult.data.findIndex(cults => cults.title === thingiverseDesign.title);

        // check if there is a matching design in cults3d
        if (cultsIndex != -1) {
            // add cults3d design to merged design
            mergedDesign.sources.push( { source: constants.SOURCE_CULTS, source_id:cults3dResult.data[cultsIndex].source_id, processingStatus: constants.PROCESSING_STATUS_MERGED });
            // update status in source list too
            cults3dResult.data[cultsIndex].processingStatus = constants.PROCESSING_STATUS_MERGED;
        } 

        // find matching design in printable by title
        let printableIndex = printableResult.data.findIndex(printable => printable.title === thingiverseDesign.title);
        
        // check if there is a matching design in printable
        if (printableIndex != -1) {
            // add printable design to merged design
            mergedDesign.sources.push( { source: constants.SOURCE_PRINTABLE, source_id:printableResult.data[printableIndex].source_id, processingStatus: constants.PROCESSING_STATUS_MERGED });
            // update status in source list too
            printableResult.data[printableIndex].processingStatus = constants.PROCESSING_STATUS_MERGED;
        } 
        
        // check if there are sources (merged designs) in merged design. If no source is found, there is no match to a thingiverse design and thingiverse design and so the merge of the thingiverse design is failed too.
        if (mergedDesign.sources.length > 0) {
            // sources are found. add merged design to merged list
            mergedDesign.sources.push( { source: constants.SOURCE_THINGIVERSE, source_id:thingiverseDesign.source_id, processingStatus: constants.PROCESSING_STATUS_MERGED });
            // update status in source list too
            thingiverseResult.data[i].processingStatus = constants.PROCESSING_STATUS_MERGED;
            // add merged design to merged list
            mergedDesigns.push(mergedDesign);
        }
    }

    // write merged designs to file
    let mergedWriteResult = await util.writeJsonFile(options.baseDirectory + "/export", "merged-sites.json", mergedDesigns.filter(design => design.sources.length > 0));
    // check if writing to file was successful
    if (mergedWriteResult.ok) {
        // use spinner to show writing to file was successful
        spinner.succeed(mergedWriteResult.data.size + " merged designs written to file " + mergedWriteResult.data.filename);
    }

    // write thingiverse source file with unmerged designs to error directory
    let thingiverseWriteResult = await util.writeJsonFile(options.baseDirectory + "/error", "thingiverse-list.json", thingiverseResult.data.filter(design => design.processingStatus != constants.PROCESSING_STATUS_MERGED));
    // check if writing to file was successful
    if (thingiverseWriteResult.ok) {
        // use spinner to show writing to file was successful
        spinner.succeed(thingiverseResult.data.size + " Thingiverse designs written to file " + thingiverseWriteResult.data.filename);
    }

    // write cults3d source file with unmerged designs to error directory
    let cultsWriteResult = await util.writeJsonFile(options.baseDirectory + "/error", "cults3d-list.json", cults3dResult.data.filter(design => design.processingStatus != constants.PROCESSING_STATUS_MERGED));
    // check if writing to file was successful
    if (cultsWriteResult.ok) {
        // use spinner to show writing to file was successful
        spinner.succeed(cultsWriteResult.data.size + " Cults3d designs written to file " + cultsWriteResult.data.filename);
    }

    // write printable source file with unmerged designs to error directory
    let printableWriteResult = await util.writeJsonFile(options.baseDirectory + "/error", "printable-list.json", printableResult.data.filter(design => design.processingStatus != constants.PROCESSING_STATUS_MERGED));
    // check if writing to file was successful
    if (printableWriteResult.ok) {
        // use spinner to show writing to file was successful
        spinner.succeed(printableWriteResult.data.size + " Printable designs written to file " + printableWriteResult.data.filename);
    }
}

/**
 * Sets the processing status of all designs in the list to "not merged"
 * 
 * @param {*} designs list of designs loaded from an api or scraped from a website [{ title: string, source: string, source_id: string }] 
 * @returns list of designs with processing status set to "not merged" [{ title: string, source: string, source_id: string, processingStatus: string }]
 */
function initializeProcessingStatus(designs) {
    // iterate over designs and set processing status to "not merged"
    for (let i = 0; i < designs.length; i++) {
        // set processing status to "not merged"
        designs[i].processingStatus = constants.PROCESSING_STATUS_NOT_MERGED;
    }

    // return updated designs
    return designs;
}

module.exports = {
    getCommand
};
