'use strict';

const commander = require("commander");
const ora = require("ora");
const process = require("process");

const constants = require("../constants");
const thingiverse = require("../sites/thingiverse");
const cults = require("../sites/cults");
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
                constants.CONNECTION_TYPE_THINGIVERSE_API,
                constants.CONNECTION_TYPE_CULTS,
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

    if (connectionType == constants.CONNECTION_TYPE_THINGIVERSE_API || connectionType == constants.CONNECTION_TYPE_ALL)  {
        // initialize spinner for thingiverse api test connection
        let thingiverseSpinner = ora("Testing Thingiverse API connection").start();

        // test connection to Thingiverse API
        const thingiverseResult = await thingiverse.getDesignDetails(process.env.DS_THINGIVERSE_TEST_ID);
        if (!thingiverseResult.ok) {
            // set spinner to failed
            thingiverseSpinner.fail("Thingiverse test connection failed: " + thingiverseResult.error);
            // let commander exit the process with an error
            commander.error(thingiverseResult.error);
        }

        // set thingiverse spinner to success
        thingiverseSpinner.succeed("Thingiverse test connection successful: " + JSON.stringify(thingiverseResult.data));
    }

    if (connectionType == constants.CONNECTION_TYPE_CULTS || connectionType == constants.CONNECTION_TYPE_ALL) {
        // initialize spinner for cults3d test connection
        let cultsSpinner = ora("Testing Cults3d connection").start();

        // test connection to Cults3d
        const cultsResult = await cults.getDesignDetails(process.env.DS_CULTS_TEST_ID);
        if (!cultsResult.ok) {
            // set spinner to failed
            cultsSpinner.fail("Cults3d test connection failed: " + cultsResult.error);
            // let commander exit the process with an error
            commander.error(cultsResult.error);
        }

        // set cults spinner to success
        cultsSpinner.succeed("Cults3d test connection successful: " + JSON.stringify(cultsResult.data));
    }
}

module.exports = {
    getCommand
};
