'use strict';

const process = require("process");
const constants = require("./constants");

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
        for (let i = 0; i < constants.MANDATORY_ENV_VARS.length; i++) {
            if (!process.env[constants.MANDATORY_ENV_VARS[i]]) {
                // mandatory environment variable is not set, return error
                return { ok: false, error: "Missing mandatory environment variable: " + constants.MANDATORY_ENV_VARS[i] };
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
