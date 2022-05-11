'use strict';

const process = require("process");

/**
 * Load configuration from a file into environment variables and check for required variables
 * 
 * @param {*} configPath Path to the config file
 * @returns { ok, error }
 */
function loadConfiguration(configPath) {
    try {
        // load config file into environment variables
        let result = require("dotenv").config({ path: configPath });

        // check result
        if (result.error) {
            // config file could not be loaded, return error
            return { ok: false, error: result.error };
        }

        // check for mandatory environment variables
        const mandatoryVars = ['DS_THINGIVERSE_API_TOKEN', 'DS_THINGIVERSE_TEST_ID']
        for (let i = 0; i < mandatoryVars.length; i++) {
            if (!process.env[mandatoryVars[i]]) {
                // mandatory environment variable is not set, return error
                return { ok: false, error: "Missing mandatory environment variable: " + mandatoryVars[i] };
            }
        }

        // all mandatory environment variables are set, return success
        return { ok: true };
    } catch (error) {
        // something went wrong, return error
        return { ok: false, error: error };
    }
}

module.exports = {
    loadConfiguration
};
