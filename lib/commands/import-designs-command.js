const commander = require("commander");
const ora = require("ora");

const util = require("../util");
const constants = require("../constants");
const thingiverse = require("../sites/thingiverse");
const printable = require("../sites/printable");
const cults = require("../sites/cults");
const browser = require("../sites/browser");
const persistence = require("../persistence/designs-sources-persistence");
const db = require("../persistence/db");

function getCommand() {
    // Create merge sites command
    return new commander.Command("importDesigns")
        .description("Import design configurations for Thingiverse, cults3d and printable")
        .argument("[importFile]", "import file path to the json file", "data/import/merged-sites.json")
        .option("-c, --config <configFile>", "config file path", "config/.env")
        .option("-b, --baseDirectory <baseDirectory>", "base directory for the result files", "data")
        .option("-m, --verifyMerged", "verify merged designs", false)
        .option("-f, --overwriteFailed", "reset failed imports in source file", false)
        .action(handler);
}

/**
 * Execute the command logic to import designs from a json file into the db and perform basic configuration checks
 * 
 * @param {*} importFile import file path to the json file
 * @param {*} options list with commander options
 */
async function handler(importFile, options) {
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

    // check schema version
    spinner.text = "Checking schema version";
    let schemaVersionResult = await db.checkSchemaVersion();
    if (!schemaVersionResult.ok) {
        spinner.fail("Schema version mismatch");
        commander.error(schemaVersionResult.error);
    }
    
    spinner.succeed("Schema version is correct");

    // initialize read file spinner
    spinner = ora("Reading designs from " + importFile).start();

    // read designs from json file
    let readResult = await util.readJsonFile(importFile);
    if (!readResult.ok) {
        // set spinner to failed
        spinner.fail("Failed to read designs from " + importFile);
        // let commander exit the process with an error
        commander.error(readResult.error);
    }

    // set spinner to success
    spinner.succeed("Read " + readResult.data.length + " designs from " + importFile);

    // initialize processing status
    let designs = initializeProcessingStatus(readResult.data, options.verifyMerged, options.overwriteFailed);

    // initialize retry counter
    let retryCounter = 0;
    const maxRetries = 5;
    let hasRetries = false;

    // do while max retries is not reached
    do {
        // initialize hasRetries flags. This is used to check if any retry is performed and to quit the retry loop early
        hasRetries = false;

        // iterate over all designs
        designsLoop: for (let designIndex = 0; designIndex < designs.length; designIndex++) {
            // get current design
            let design = designs[designIndex];

            // check if design has sources
            if (!hasSources(design)) {
                // no sources found

                // initialize source array for easier handling
                designs[designIndex].sources = [];

                // if this is the first iteration set spinner to failed
                if (retryCounter == 0) {
                    spinner = ora(util.renderSpinnerPrefix(designIndex, designs.length) + "Verification of " + design.title + " failed. No sources found").fail();
                    designs[designIndex].processingStatus = constants.PROCESSING_STATUS_FAILED_NO_SOURCES;
                }

                // process next design
                continue designsLoop;
            }

            // iterate over sources
            sourcesLoop: for (let sourceIndex = 0; sourceIndex < design.sources.length; sourceIndex++) {
                // get current source
                let source = design.sources[sourceIndex];

                // check if source is already merged or failed
                if (source.processingStatus == constants.PROCESSING_STATUS_IMPORTED || source.processingStatus.startsWith("FAILED")) {
                    // source is already merged or failed. process next source
                    continue sourcesLoop;
                }

                // check if source is already present in the db
                let findOneResult = await persistence.findOneSourceByTitleAndSourceType(design.title, source.source);
                if (findOneResult.ok) {
                    spinner.succeed(util.renderSpinnerPrefix(designIndex, designs.length, false) + "Skipped " + design.title + " from " + source.source + " because it is already present in the db");
                    // source is already merged. process next source
                    continue sourcesLoop;
                }

                let isRetry = source.processingStatus == constants.PROCESSING_STATUS_RETRY ? true : false;

                // initialize source spinner
                spinner = ora(util.renderSpinnerPrefix(designIndex, designs.length, false) + "Importing " + design.title + " from " + source.source).start();

                // validate source
                let validateResult = await validateSource(source, design.title, retryCounter, maxRetries);
                if (!validateResult.ok) {
                    if (validateResult.error == constants.PROCESSING_STATUS_RETRY) {
                        // set retry flag
                        hasRetries = true;

                        // set spinner to warning
                        spinner.warn(util.renderSpinnerPrefix(designIndex, designs.length, isRetry) + "Verification of " + design.title + " from " + source.source + " failed. Not found, no or unparsable response. Retrying later.");
                    } else {
                        // source validation failed because of other reason. set spinner to failed
                        spinner.fail(util.renderSpinnerPrefix(designIndex, designs.length, isRetry) + "Verification of " + design.title + " from " + source.source + " failed. " + validateResult.error);
                    }

                    // update source's processing status
                    designs[designIndex].sources[sourceIndex].processingStatus = validateResult.error;

                    // process next source and avoid further processing
                    continue sourcesLoop;
                }

                // source is valid. update source's processing status
                designs[designIndex].sources[sourceIndex].processingStatus = validateResult.data;

                const persistenceResult = await persistence.insertOneSource(design.title, source.source, source.source_id);
                if (!persistenceResult.ok) {
                    // set spinner to failed
                    spinner.fail(util.renderSpinnerPrefix(designIndex, designs.length, isRetry) + "Failed to insert source " + source.source + " into db");

                    // update source's processing status
                    designs[designIndex].sources[sourceIndex].processingStatus = constants.PROCESSING_STATUS_FAILED_DB_ERROR;

                    // process next source and avoid further processing
                    continue sourcesLoop;
                }

                // set spinner to success
                spinner.succeed(util.renderSpinnerPrefix(designIndex, designs.length, isRetry) + "Imported " + design.title + " from " + source.source);

                // update source's processing status
                designs[designIndex].sources[sourceIndex].processingStatus = constants.PROCESSING_STATUS_IMPORTED;
            }
        }
        // only break the retry loop if no retry was performed or if the retry counter is at the maximum
    } while (hasRetries && retryCounter++ < maxRetries);

    // close the browser
    browser.closeBrowser();

    // release to db pool
    db.endPool();

    // initialize arrays used for the result file(s)
    let { imports, fails } = filterDesignsByStatus(designs);

    // write import sources to json file
    let importWriteResult = await util.writeJsonFile(options.baseDirectory + "/export", "importDesigns.json", imports);
    // check if writing to file was successful
    if (importWriteResult.ok) {
        // use spinner to show writing to file was successful
        spinner.succeed(importWriteResult.data.size + " imported designs written to file " + importWriteResult.data.filename);
    }

    // write import sources to json file
    let failedWriteResult = await util.writeJsonFile(options.baseDirectory + "/error", "failed-importDesigns.json", fails);
    // check if writing to file was successful
    if (failedWriteResult.ok) {
        // use spinner to show writing to file was successful
        spinner.succeed(failedWriteResult.data.size + " imported designs written to file " + failedWriteResult.data.filename);
    }
}

/**
 * Filter designs by processing status and return an array with imported designs and on with failed designs
 * 
 * @param {*} designs list of designs from the import file
 * @returns two list of imported designs (imports) and list of failed designs (fails)
 */
function filterDesignsByStatus(designs) {
    // initialize arrays used for the result
    let fails = [];
    let imports = [];

    // iterate over all designs and copy imported sources to the imports array and failed to failed array
    for (let designIndex = 0; designIndex < designs.length; designIndex++) {
        // get current design
        let design = designs[designIndex];

        // initialize design object
        let failed = { title: design.title, sources: [] };
        let imported = { title: design.title, sources: [] };

        // iterate over all sources
        for (let sourceIndex = 0; sourceIndex < design.sources.length; sourceIndex++) {
            // get current source
            let source = design.sources[sourceIndex];
            if (source.processingStatus == constants.PROCESSING_STATUS_IMPORTED) {
                // source is imported. copy it to the imported array
                imported.sources.push(source);
            } else {
                // source is failed. copy it to the fails array
                failed.sources.push(source);
            }
        }

        // copy failed design to fails array if it has failed sources
        if (failed.sources.length > 0) {
            fails.push(failed);
        }

        // copy imported design to imports array if it has imported sources
        if (imported.sources.length > 0) {
            imports.push(imported);
        }
    }
    // return the result
    return { imports, fails };
}

/**
 * Get the source from the source site and compare the downloaded title with the design title.
 * 
 * @param {{source: string, source_id: string, processingStatus: string}} source source object from the import file to validate
 * @param {string} title title of the design
 * @param {number} retryCounter current retry counter
 * @param {number} maxRetries maximum retry counter
 * @returns {ok: boolean, data: string, error: string}
 */
async function validateSource(source, title, retryCounter, maxRetries) {
    // check if source is already imported
    if (source.processingStatus == constants.PROCESSING_STATUS_MERGED) {
        // return success because the source is already merged
        return { ok: true, data: source.processingStatus };
    }

    // initialize request result
    let detailsResult = null;

    // call api/webs craping function based on source type
    if (source.source == constants.SOURCE_THINGIVERSE) {
        // get source details from thingiverse
        detailsResult = await thingiverse.getDesign(source.source_id);
    } else if (source.source == constants.SOURCE_CULTS) {
        // get source details from cults
        detailsResult = await cults.getDesign(source.source_id);
    } else if (source.source == constants.SOURCE_PRINTABLE) {
        // get source details from printable
        detailsResult = await printable.getDesign(source.source_id);
    } else {
        // unknown source, return error
        return { ok: false, error: constants.PROCESSING_STATUS_FAILED_UNKNOWN_SOURCE };
    }

    // check if request was successful
    if (!detailsResult.ok) {
        // request failed. check if it's a retry
        if (retryCounter + 1 < maxRetries) {
            // it's a retry and max retries are not reached yet. return retry and give it another try
            return { ok: false, error: constants.PROCESSING_STATUS_RETRY };
        } else {
            // it's a retry and max retries are reached. return error and stop retrying
            return { ok: false, error: constants.PROCESSING_STATUS_NOT_FOUND };
        }
    }

    // request was successful. check if the title matches
    if (detailsResult.data.title.trim() != title.trim()) {
        // title does not match
        return { ok: false, error: constants.PROCESSING_STATUS_FAILED_TITLE_MISMATCH + " (>" + detailsResult.data.title + "</>" + title + "<)" };
    }

    // title matches, return success
    return { ok: true, data: constants.PROCESSING_STATUS_MERGED };
}

/**
 * Initialize or updated the processing status of all sources in the designs array.
 * 
 * @param {*} designs list of designs from the import file
 * @param {*} verifyMerged if true, processingStatus merged will be set to unprocessed and the source will be verified
 * @param {*} overwriteFailed if true, processingStatus that start with "FAILED" will be set to unprocessed and the source will be verified
 * @returns list of designs with initialized / updated processingStatus
 */
function initializeProcessingStatus(designs, verifyMerged, overwriteFailed) {
    // iterate over all designs
    for (let designIndex = 0; designIndex < designs.length; designIndex++) {
        // get current design
        let design = designs[designIndex];

        // check if the design has sources
        if (!hasSources(design)) {
            // no sources, skip it and continue with next design
            continue;
        }

        // iterate over sources
        for (let sourceIndex = 0; sourceIndex < design.sources.length; sourceIndex++) {
            // get current source
            let source = design.sources[sourceIndex];

            if (!source.processingStatus) {
                // source has no processing status, initialize it
                source.processingStatus = constants.PROCESSING_STATUS_UNPROCESSED;
            } else if (source.processingStatus == "") {
                // source has empty processing status, initialize it
                source.processingStatus = constants.PROCESSING_STATUS_UNPROCESSED;
            } else if (source.processingStatus == constants.PROCESSING_STATUS_MERGED && verifyMerged) {
                // source is already merged but user forces to verify it again
                source.processingStatus = constants.PROCESSING_STATUS_UNPROCESSED;
            } else if (source.processingStatus.startsWith("FAILED") && overwriteFailed) {
                // source is already failed but user forces to verify it again
                source.processingStatus = constants.PROCESSING_STATUS_UNPROCESSED;
            }

            // set processing status
            designs[designIndex].sources[sourceIndex] = source;
        }
    }

    // return design with initialized / updated processingStatus
    return designs;
}

/**
 * Check if the design has sources.
 * 
 * @param {*} design design object from the import file
 * @returns true if the design has sources, false otherwise
 */
function hasSources(design) {
    // check if design has sources
    if (!design.sources) {
        // no sources
        return false;
    }

    // check if design has sources
    if (!design.sources.length) {
        // empty sources element
        return false;
    }

    // design has sources
    return true;
}

module.exports = {
    getCommand
};
