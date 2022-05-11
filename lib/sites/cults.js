'use strict';

const fetch = require("node-fetch");
const process = require("process");

/**
 * Get the design details for a design id
 * 
 * @param {*} id Thingiverse id of the design to get details for
 * @returns { ok, error, data }
 */
async function getDesignDetails(id) {
    try {
        // construct url
        const url = "https://cults3d.com/en/3d-model/home/" + id;

        // fetch design details
        const response = await fetch(url, { timeout: process.env.DS_CULTS_TIMEOUT });

        // check for response status
        if (!response.ok) {
            // request failed, return error
            return { ok: false, error: "Error: " + response.statusText + " (" + response.status + ")" };
        }

        // request succeeded, parse response
        const body = await response.text();

        // get title
        const titleResult = getTitle(body);
        //check for title error
        if (!titleResult.ok) {
            return { ok: false, error: titleResult.error };
        }

        // get download count
        const downloadsResult = getSingularCounterValue("download", body);
        //check for download count error
        if (!downloadsResult.ok) {
            return { ok: false, error: downloadsResult.error };
        }

        // get like count
        const likesResult = getLikeCounterValue(body);
        //check for like count error
        if (!likesResult.ok) {
            return { ok: false, error: likesResult.error };
        }

        // create result object with the data element of the result objects
        const designDetails = {
            id: id,
            title: titleResult.data,
            downloads: downloadsResult.data || 0,
            likes: likesResult.data || 0
        }

        // return success and design details
        return { ok: true, data: designDetails };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

/**
 * Get title from the design details page
 * 
 * @param {*} bodyText text (html) from the response body
 * @returns { ok, error, data }
 */
function getTitle(bodyText) {
    try {
        // get title and clean it up
        let title = bodyText.match(/".*og:title".*/g)[0].trim().split("=")[1].trim().split(">")[0].slice(1, -1);
        let cleanTitle = replaceHtmlMasking(title).trim();

        // return success and title
        return { ok: true, data: cleanTitle };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

/**
 * Replace /remove html masking in a string
 * 
 * @param {*} str string to be processed
 * @returns string without html masking
 */
function replaceHtmlMasking(str) {
    str = str.replace(/&amp;/g, "&");
    str = str.replace(/&quot;/g, "\"");
    str = str.replace(/&#039;/g, "'");
    str = str.replace(/&lt;/g, "<");
    str = str.replace(/&gt;/g, ">");
    str = str.replace(/&nbsp;/g, " ");

    return str;
}

/**
 * Get number value of a counter element by name
 * 
 * @param {*} counterName name of the counter to get the value for
 * @param {*} bodyText text (html) from the response body
 * @returns { ok, error, data }
 */
function getSingularCounterValue(counterName, bodyText) {
    try {
        // define search pattern
        let regexp = new RegExp(".*data-counter-text-singular=\"" + counterName + "\".*", "g");

        // extract counter value with regexp
        let counterValue = bodyText.match(regexp)[0].trim().match(/\d+/)[0];

        // return success and counter value
        return { ok: true, data: counterValue };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

/**
 * Get number of the likes counter
 * 
 * @param {*} bodyText text (html) from the response body
 * @returns { ok, error, data }
 */
function getLikeCounterValue(bodyText) {
    try {
        // define search pattern
        let regexp = new RegExp(".*data-like-counter-text-singular=\"like\".*", "g");

        // extract counter value with regexp
        let counterValue = bodyText.match(regexp)[0].trim().match(/\d+/)[0];

        // return success and counter value
        return { ok: true, data: counterValue };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

module.exports = {
    getDesignDetails
};