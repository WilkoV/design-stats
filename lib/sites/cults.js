'use strict';

const fetch = require("node-fetch");
const process = require("process");
const constants = require("../constants");
const browser = require("./browser");

/**
 * Get the list of designs from a user
 * 
 * @returns { ok: boolean, error: any, data {title: string, source_id: string} }
 */
async function getDesigns() {
    const username = process.env.DS_CULTS_USERNAME;

    // open browser page
    const browserPageResult = await browser.openBrowserPage(false);
    if (!browserPageResult.ok) {
        // an error occurred, return error
        return { ok: false, error: browserPageResult.error };
    }

    const browserPage = browserPageResult.data;

    // Initialize lists and counters
    let pageNumber = 1;
    let designs = [];
    let fromElements = [];

    try {
        // Repeat until no more designs are found
        do {
            // reset
            fromElements = [];

            // construct URL
            const url = "https://cults3d.com/en/users/" + username + "/creations?page=" + pageNumber;

            // open url in browser page
            await browserPage.goto(url, { waitUntil: "load" });

            // scroll down to load all designs
            await browser.autoScroll(browserPage);

            // get details of all designs
            fromElements = await browserPage.$$eval("article > div > a", elementsFromPage => {
                return elementsFromPage.map(elementFromPage => "" + elementFromPage.textContent.trim().split("\n")[0].trim() + "|" + elementFromPage.href);
            });

            // cleanup list
            for (let i = 0; i < fromElements.length; i++) {
                // get key/value pair
                let keyValue = fromElements[i].split("|");
                // get title and id
                let title = keyValue[0].trim();
                let id = keyValue[1].split("/").pop();

                // add to final map
                designs.push({ title: title, source: constants.SOURCE_CULTS, source_id: id });
            }

            // increment page number
            pageNumber++;

            // repeat until no more designs
        } while (fromElements.length > 0);

        // return success and design list
        return { ok: true, data: designs };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    } finally {
        // close browser
        await browser.closeBrowser();
    }
}

/**
 * Get the design details of a design id
 * 
 * @param {*} id Thingiverse id of the design to get details for
 * @returns Promise<{ ok: boolean, error: any, data {id: string, title: string, downloads: number, likes: number} }>
 */
async function getDesign(id) {
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
            source: constants.SOURCE_CULTS,
            source_id: id,
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
 * @returns { ok: boolean, error: any, data number }
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
 * @returns { ok: boolean, error: any, data number }
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
 * @returns { ok: boolean, error: any, data number }
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
    getDesigns,
    getDesign
};