'use strict';

const fs = require('fs');
const path = require('path');
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

/**
 * Write data to a json file
 * 
 * @param {string} filepath path to the json file
 * @param {string} filename name of the json file
 * @param {[*]} data data to be written to the file
 * @returns {ok: string, error: any, data: { filename: fullFilename, size: data.length } }
 */
async function writeJsonFile(filepath, filename, data) {
    try {
        // check data length
        if (data.length === 0) {
            // data is empty, return error
            return { ok: false, error: "Data is empty" };
        }

        // create directory if it does not exist
        if (!fs.existsSync(filepath)) {
            fs.mkdirSync(filepath, { recursive: true });
        }

        // create filename
        let fullFilename = createFilename(filepath, filename);

        // write file
        fs.writeFileSync(fullFilename, JSON.stringify(data, null, 4),);

        // return success
        return { ok: true, data: {filename: fullFilename, size: data.length} };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

/**
 * Read data from a json file and return it parsed
 * 
 * @param {string} filepath path to the json file
 * @param {string} filename name of the json file
 * @returns {ok: string, error: any, data: [*]}
 */
async function readJsonFile(filepath, filename) {
    try {
        // read file
        let data = fs.readFileSync(createFilename(filepath, filename));

        // check if file is empty
        if (data.length === 0) {
            return { ok: false, error: "File is empty" };
        }

        // parse and return data
        return { ok: true, data: JSON.parse(data) };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

/**
 * Render the full filename path. It will contain no double separators, os aware directory separators and always the file extension .json
 * 
 * @param {string} filepath path to the json file
 * @param {string} filename name of the json file
 * @returns string full filename
 */
function createFilename(filepath, filename) {
    // check if filepath ends with a separator
    if (!filepath.endsWith("/") && !filepath.endsWith("\\")) {
        filepath += "/";
    }

    // check if filename ends with .json
    if (!filename.endsWith(".json")) {
        filename += ".json";
    }
    
    // concatenate filepath and filename
    let fullFilename = filepath + filename;

    // replace backslashes with forward slashes
    fullFilename = fullFilename.replace(/\\/g, "/");

    // clean double slashes
    fullFilename = fullFilename.replace(/\/\//g, "/");

    // replace slashes with os specific directory separator
    fullFilename = fullFilename.replace(/\//g, path.sep);

    // return full filename
    return fullFilename;
}

module.exports = {
    loadConfiguration,
    writeJsonFile,
    readJsonFile
};
