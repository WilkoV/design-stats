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
        return { ok: true, data: { filename: fullFilename, size: data.length } };
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
        let fullFilename = null;

        // check if filename is provided separately or if filename and filepath are provided together
        if (filename) {
            // create filename
            fullFilename = createFilename(filepath, filename);
        } else {
            // use filepath as filename
            fullFilename = filepath;
        }

        // read file
        let data = fs.readFileSync(fullFilename);

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

/**
 * Pad a number with leading blank spaces
 * 
 * @param {number} currentValue number to be padded with blanks
 * @param {number} maxValue maximum value (is used to calculate the number of blanks)
 * @returns padded number as string
 */
function padStartBlank(currentValue, maxValue) {
    // get max length
    let maxLength = maxValue.toString().length;

    // pad current value
    let result = String(currentValue).padStart(maxLength, ' ')

    // return result
    return result;
}

function padStartZeros(currentValue, maxValue) {
    // get max length
    let maxLength = maxValue.toString().length;

    // pad current value
    let result = String(currentValue).padStart(maxLength, '0')

    // return result
    return result;
}

/**
 * Convert a string to a hexadecimal string
 * 
 * @param {string} str string to be converted
 * @returns hexadecimal string
 */
function convertToHex(str) {
    // initialize hexString
    var hexString = "";

    // iterate over each character of the string
    for (var i = 0; i < str.length; i++) {
        // get the character code and concatenate it to the hexString
        hexString += "" + str.charCodeAt(i).toString(16);
    }

    // return hexString
    return hexString;
}

/**
 *  Render the counter prefix for a spinner
 * 
 * @param {number} currentValue current position in the array
 * @param {number} maxValue maximum position in the array
 * @param {boolean} isRetry true if the function is called during a retry otherwise false.
 * @returns prefix string like " 12/165 (retry): " or " 12/165: "
 */
function renderSpinnerPrefix(currentValue, maxValue, isRetry = false) {
    // initialize postfix
    let postfix = isRetry ? " (retry): " : ": ";

    // render the prefix and return it
    return padStartBlank(currentValue + 1, maxValue) + "/" + padStartBlank(maxValue, maxValue) + postfix;
}

function formatDate(date) {
    let result = [
        date.getFullYear(),
        padStartZeros(date.getMonth() + 1, 31),
        padStartZeros(date.getDate(), 31),
    ].join('-');

    return result;
}

function subtractDate(date, numberOfDays) {
    // subtract number of days from date
    date.setDate(date.getDate() - numberOfDays);
    let result = new Date(formatDate);
    return result;
}

function getDayInYear(date) {
    var start = new Date(date.getFullYear(), 0, 0);
    var diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    var oneDay = 1000 * 60 * 60 * 24;
    var day = Math.floor(diff / oneDay);
    
    return day;
}

module.exports = {
    loadConfiguration,
    writeJsonFile,
    readJsonFile,
    padStartBlank,
    convertToHex,
    renderSpinnerPrefix,
    formatDate,
    getDayInYear,
    subtractDate,
};
