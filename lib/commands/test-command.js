'use strict';

const commander = require("commander");
const ora = require("ora");
const process = require("process");

const constants = require("../constants");
const thingiverse = require("../sites/thingiverse");
const cults = require("../sites/cults");
const printable = require("../sites/printable");
const browser = require("../sites/browser");
const util = require("../util");

/**
 * Get the command line command for the test command
 * 
 * @returns {commander.Command} The command object fo the test command
 */
function getCommand() {
    // Create merge sites command
    return new commander.Command("test")
        .description("Test connections to the database and 3d printing sites")
        .option("-c, --config <configFile>", "config file path", "config/.env")
        .addArgument(new commander
            .Argument("[connectionType]", "Type of connection to test")
            .choices([
                constants.CONNECTION_TYPE_THINGIVERSE_API_DETAILS,
                constants.CONNECTION_TYPE_THINGIVERSE_API_LIST,
                constants.CONNECTION_TYPE_CULTS_DETAILS,
                constants.CONNECTION_TYPE_CULTS_LIST,
                constants.CONNECTION_TYPE_PRINTABLE_DETAILS,
                constants.CONNECTION_TYPE_PRINTABLE_LIST,
                constants.CONNECTION_TYPE_ALL
            ])
            .default(constants.CONNECTION_TYPE_ALL))
        .action(handler);
}

/**
 * Execute the command logic to load data from the sites and merge them into one csv file
 * 
 * @param {*} connectionType Type of connection to test
 * @param {*} options Commander options containing e.g. config file path
 */
async function handler(connectionType, options) {
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

    // execute connection test for thingiverse api details 
    if (connectionType == constants.CONNECTION_TYPE_THINGIVERSE_API_DETAILS || connectionType == constants.CONNECTION_TYPE_ALL) {
        // initialize spinner for thingiverse api test connection
        let thingiverseSpinner = ora("Testing Thingiverse API connection for details").start();

        // test connection to Thingiverse API
        const thingiverseResult = await thingiverse.getDesign(process.env.DS_THINGIVERSE_TEST_ID);
        if (!thingiverseResult.ok) {
            // set spinner to failed
            thingiverseSpinner.fail("Thingiverse test connection for details failed: " + thingiverseResult.error);
        } else {
            // set thingiverse spinner to success
            thingiverseSpinner.succeed("Thingiverse test connection for details successful: " + JSON.stringify(thingiverseResult.data));
        }
    }

    // execute connection test for thingiverse api list
    if (connectionType == constants.CONNECTION_TYPE_THINGIVERSE_API_LIST || connectionType == constants.CONNECTION_TYPE_ALL) {
        // initialize spinner for thingiverse api list connection
        let thingiverseListSpinner = ora("Testing Thingiverse API connection for lists").start();

        // test connection to Thingiverse API
        const thingiverseListResult = await thingiverse.getDesigns();
        if (!thingiverseListResult.ok) {
            // set spinner to failed
            thingiverseListSpinner.fail("Thingiverse test connection for lists failed: " + thingiverseListResult.error);
        } else {
            // set thingiverse list spinner to success
            thingiverseListSpinner.succeed("Thingiverse test connection for lists successful: Found " + thingiverseListResult.data.length + " designs. First design: " + JSON.stringify(thingiverseListResult.data[0]));
        }
    }

    // execute connection test for cults details
    if (connectionType == constants.CONNECTION_TYPE_CULTS_DETAILS || connectionType == constants.CONNECTION_TYPE_ALL) {
        // initialize spinner for cults3d test connection
        let cultsSpinner = ora("Testing Cults3d connection for details").start();

        // test connection to Cults3d
        const cultsResult = await cults.getDesign(process.env.DS_CULTS_TEST_ID);
        if (!cultsResult.ok) {
            // set spinner to failed
            cultsSpinner.fail("Cults3d test connection for details failed: " + cultsResult.error);
        } else {
            // set cults spinner to success
            cultsSpinner.succeed("Cults3d test connection for details successful: " + JSON.stringify(cultsResult.data));
        }
    }

    // execute connection test for cults list
    if (connectionType == constants.CONNECTION_TYPE_CULTS_LIST || connectionType == constants.CONNECTION_TYPE_ALL) {
        // initialize spinner for cults3d test connection
        let cultsListSpinner = ora("Testing Cults3d connection for lists").start();
        
        // test connection to Cults3d
        const cultsListResult = await cults.getDesigns();
        if (!cultsListResult.ok) {
            // set spinner to failed
            cultsListSpinner.fail("Cults3d test connection for lists failed: " + cultsListResult.error);
        } else {
            // set cults list spinner to success
            cultsListSpinner.succeed("Cults3d test connection for lists successful: Found " + cultsListResult.data.length + " designs. First design: " + JSON.stringify(cultsListResult.data[0]));
        }
    }

    // execute connection test for printable details
    if (connectionType == constants.CONNECTION_TYPE_PRINTABLE_DETAILS || connectionType == constants.CONNECTION_TYPE_ALL) {
        // initialize spinner for printable test connection
        let printableSpinner = ora("Testing Printable connection for details ").start();

        // test connection to Printable
        const printableResult = await printable.getDesign(process.env.DS_PRINTABLE_TEST_ID);
        if (!printableResult.ok) {
            // close browser and browser page
            await browser.closeBrowser();
            // set spinner to failed
            printableSpinner.fail("Printable test connection for details failed: " + printableResult.error);
        } else {
            // close browser and browser page
            await browser.closeBrowser();
            // set printable spinner to success
            printableSpinner.succeed("Printable test connection for details successful: " + JSON.stringify(printableResult.data));
        }
    }

    // execute connection test for printable list
    if (connectionType == constants.CONNECTION_TYPE_PRINTABLE_LIST || connectionType == constants.CONNECTION_TYPE_ALL) {
        // initialize spinner for printable test connection
        let printableListSpinner = ora("Testing Printable connection for lists").start();
        
        // test connection to Printable
        const printableListResult = await printable.getDesigns();
        if (!printableListResult.ok) {
            // set spinner to failed
            printableListSpinner.fail("Printable test connection for lists failed: " + printableListResult.error);
        } else {
            // set printable list spinner to success
            printableListSpinner.succeed("Printable test connection for lists successful: Found " + printableListResult.data.length + " designs. First design: " + JSON.stringify(printableListResult.data[0]));
        }
    }
}

module.exports = {
    getCommand
};
