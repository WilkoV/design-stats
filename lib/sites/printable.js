'use strict';

const puppeteer = require("puppeteer");

let browser = null;
let browserPage = null;

/**
 * Get the details of a design
 * 
 * @param {*} id Printable id of the design to get details for
 * @returns Promise<{ ok: boolean, error: any, data {id: string, title: string, downloads: number, likes: number} }>
 */
async function getDesignDetails(id) {
    try {

        const openBrowserResult = await openBrowserPage(true);
        if (!openBrowserResult.ok) {
            return { ok: false, error: openBrowserResult.error };
        }

        // construct url
        let url = "https://www.printables.com/model/" + id;

        // open url in browser page
        await browserPage.goto(url, { waitUntil: "load" });

        // get title
        let titleResult = await getTitle();
        if (!titleResult.ok) {
            return { ok: false, error: titleResult.error };
        }

        // get number of downloads
        let numberOfDownloads = await getNumberOfDownloads();
        if (!numberOfDownloads.ok) {
            return { ok: false, error: numberOfDownloads.error };
        }

        // get number of likes
        let numberOfLikes = await getNumberOfLikes();
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
async function getTitle() {
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
async function getNumberOfDownloads() {
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
async function getNumberOfLikes() {
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

/**
 * Open a browser page and the browser itself if needed. If the page is already open it will be reused.
 * 
 * @param {*} headless true if browser should be headless (no UI) and false if it should be visible
 * @returns Promise<{ ok: boolean, error: any }>
 */
async function openBrowserPage(headless) {
    try {
        // check if page is already open
        if (browserPage) {
            // page is already open, return it
            return { ok: true, data: browserPage };
        }

        // check if browser is already open
        if (!browser) {
            // browser is not open, open it
            browser = await puppeteer.launch({
                headless: headless,
                slowMo: 100,
                devtools: false
            });
        }

        // check if browser page is already open
        if (!browserPage) {
            // browser page is not open, open it
            browserPage = await browser.newPage();
        }

        // return success
        return { ok: true, data: browserPage };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

/**
 * Close browser pages and the browser itself
 * 
 * @returns Promise<{ ok: boolean, error: any }> 
 */
async function closeBrowser() {
    try {
        // check if browser is already open
        if (browserPage) {
            // browser page is open, close it
            await browserPage.close();
            browserPage = null;
        }

        // check if browser is already open
        if (browser) {
            // browser is open, close it
            await browser.close();
            browser = null;
        }

        // return success
        return { ok: true };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

module.exports = {
    getDesignDetails,
    closeBrowser
}
