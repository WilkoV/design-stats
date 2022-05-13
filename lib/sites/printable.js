'use strict';

const browser = require("./browser");

/**
 * Get the details of a design
 * 
 * @param {*} id Printable id of the design to get details for
 * @returns Promise<{ ok: boolean, error: any, data {id: string, title: string, downloads: number, likes: number} }>
 */
async function getDesign(id) {
    try {

        const openBrowserResult = await browser.openBrowserPage(true);
        if (!openBrowserResult.ok) {
            return { ok: false, error: openBrowserResult.error };
        }

        let browserPage = openBrowserResult.data;

        // construct url
        let url = "https://www.printables.com/model/" + id;

        // open url in browser page
        await browserPage.goto(url, { waitUntil: "load" });

        // get title
        let titleResult = await getTitle(browserPage);
        if (!titleResult.ok) {
            return { ok: false, error: titleResult.error };
        }

        // get number of downloads
        let numberOfDownloads = await getNumberOfDownloads(browserPage);
        if (!numberOfDownloads.ok) {
            return { ok: false, error: numberOfDownloads.error };
        }

        // get number of likes
        let numberOfLikes = await getNumberOfLikes(browserPage);
        if (!numberOfLikes.ok) {
            return { ok: false, error: numberOfLikes.error };
        }

        // create design details object
        const designDetails = {
            id: id,
            title: titleResult.data,
            downloads: numberOfDownloads.data || 0,
            likes: numberOfLikes.data || 0
        }

        // return success
        return { ok: true, data: designDetails };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

/**
 * Get the title of a design
 * 
 * @returns Promise<{ ok: boolean, error: any, data: string }>
 */
async function getTitle(browserPage) {
    try {
        let title = await browserPage.$eval("detail-header > div > h2", element => element.textContent.trim());

        // return success
        return { ok: true, data: title };
    } catch (error) {
        return { ok: false, error: error };
    }
}

/**
 * Get the number of downloads for a design
 * 
 * @returns Promise<{ ok: boolean, error: any, data: number }>
 */
async function getNumberOfDownloads(browserPage) {
    try {
        let result = await browserPage.$$eval("div > div > div > a > div > span", elements => {
            return elements.map(element => element.textContent.trim());
        });

        let numberOfDownloads = getNumberValue(result, "Download");
        if (!numberOfDownloads.ok) {
            return { ok: false, error: numberOfDownloads.error };
        }

        // return success
        return { ok: true, data: numberOfDownloads.data };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

/**
 * Get the number of likes for a design
 * 
 * @returns Promise<{ ok: boolean, error: any, data: number}>
 */
async function getNumberOfLikes(browserPage) {
    try {
        let result = await browserPage.$$eval("market-interaction-panel > div > button > span", elements => {
            return elements.map(element => element.textContent.trim());
        });

        let numberOfLikes = getNumberValue(result, "Like");
        if (!numberOfLikes.ok) {
            return { ok: false, error: numberOfLikes.error };
        }

        // return success
        return { ok: true, data: numberOfLikes.data };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

/**
 * Get the number value from an element with a specific text
 * 
 * @param {*} elements element from the page
 * @param {*} name name of the element to search for
 * @returns { ok: boolean, error: any, data: number }
 */
function getNumberValue(elements, name) {
    try {
        let value = "";

        // find named element and get the next one
        for (let i = 0; i < elements.length; i++) {
            if (elements[i] == name) {
                value = elements[i + 1];
            }
        }

        // remove blanks from value
        value = value.replace(/\s/g, '');

        // remove x (last character) from tmp
        value = value.substring(0, value.length - 1);

        // return value or 0 if not found
        return { ok: true, data: value || 0 };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

module.exports = {
    getDesign
}
