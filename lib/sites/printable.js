'use strict';

const process = require("process");
const browser = require("./browser");
const constants = require("../constants");
const util = require("../util");

async function getDesigns() {
    try {
        const userId = process.env.DS_PRINTABLE_USER_ID;

        // open browser page
        const browserPageResult = await browser.openBrowserPage(false);
        if (!browserPageResult.ok) {
            // an error occurred, return error
            return { ok: false, error: browserPageResult.error };
        }

        const browserPage = browserPageResult.data;

        // construct url
        let url = "https://www.printables.com/social/" + userId + "/models";

        // open url in browser page
        await browserPage.goto(url, { waitUntil: "load" });

        // scroll down to load all designs
        await browser.autoScroll(browserPage);

        // get details of all designs
        const fromElements = await browserPage.$$eval("h3 > a", elementsFromPage => {
            return elementsFromPage.map(elementFromPage => "" + elementFromPage.textContent.trim() + "|" + elementFromPage.href);
        });

        // cleanup list
        let designs = [];
        for (let i = 0; i < fromElements.length; i++) {
            // get key/value pair
            let keyValue = fromElements[i].split("|");
            // get title and id
            let title = keyValue[0].trim();
            let id = keyValue[1].split("/").pop();

            // add to final map
            designs.push({ title: title, source: constants.SOURCE_PRINTABLE, source_id: id });
        }

        // return success
        return { ok: true, data: designs };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    } finally {
        // close browser page
        await browser.closeBrowser();
    }
}

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
        let numberOfDownloadsResult = await getNumberOfDownloads(browserPage);
        if (!numberOfDownloadsResult.ok) {
            return { ok: false, error: numberOfDownloadsResult.error };
        }

        // get number of likes
        let numberOfLikesResult = await getNumberOfLikes(browserPage);
        if (!numberOfLikesResult.ok) {
            return { ok: false, error: numberOfLikesResult.error };
        }

        // get number of views
        let numberOfViewsResult = await getNumberOfViews(browserPage);
        if (!numberOfViewsResult.ok) {
            return { ok: false, error: numberOfViewsResult.error };
        }

        // get number of makes
        let numberOfMakesResult = await getNumberOfMakes(browserPage);
        if (!numberOfMakesResult.ok) {
            return { ok: false, error: numberOfMakesResult.error };
        }

        // if the number of makes is not available on the page than "Shar" is returned. 
        // In this case we need to get the number of makes from the likes
        if (numberOfMakesResult.data.startsWith("Shar")) {
            numberOfMakesResult.data = 0;
        }

        // get number of remixes
        let numberOfRemixesResult = await getNumberOfRemixes(browserPage);
        if (!numberOfRemixesResult.ok) {
            return { ok: false, error: numberOfRemixesResult.error };
        }

        // get number of comments
        let numberOfCommentsResult = await getNumberOfComments(browserPage, numberOfMakesResult.data);
        if (!numberOfCommentsResult.ok) {
            return { ok: false, error: numberOfCommentsResult.error };
        }

        // get number of collections
        let numberOfCollectionsResult = await getNumberOfCollections(browserPage);
        if (!numberOfCollectionsResult.ok) {
            return { ok: false, error: numberOfCollectionsResult.error };
        }

        // create design details object
        const designDetails = {
            source: constants.SOURCE_PRINTABLE,
            source_id: id,
            title: titleResult.data,
            downloads: parseInt(numberOfDownloadsResult.data) || 0,
            likes: parseInt(numberOfLikesResult.data) || 0,
            views: parseInt(numberOfViewsResult.data) || 0,
            makes: parseInt(numberOfMakesResult.data) || 0,
            remixes: parseInt(numberOfRemixesResult.data) || 0,
            comments: parseInt(numberOfCommentsResult.data) || 0,
            collections: parseInt(numberOfCollectionsResult.data) || 0
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

        // WORKAROUND: From time to time the title is not parsable, so we need to report an error and the caller can try again
        if (util.convertToHex(title).startsWith("258825")) {
            return { ok: false, error: "title is not valid" };
        }

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

        let numberOfDownloads = getNumberValueAfterKey(result, "Download");
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

        let numberOfLikes = getNumberValueAfterKey(result, "Like");
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

async function getNumberOfViews(browserPage) {
    try {
        let result = await browserPage.$$eval("div > div > div > div > div > span", elements => {
            return elements.map(element => element.textContent.trim());
        });

        let numberOfViews = 0;
        
        // iterate over all elements
        for (let i = 0; i < result.length; i++) {
            const element = result[i];

            // check if element contains the key "View"
            if (element.includes("iew")) {
                numberOfViews = getNumberFromString(result[i], "views");
                break;
            }
        }

        if (!numberOfViews.ok) {
            return { ok: false, error: numberOfViews.error };
        }

        // return success
        return { ok: true, data: numberOfViews.data };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

async function getNumberOfMakes(browserPage) {
    try {
        let result = await browserPage.$$eval("market-interaction-panel > div > button > span", elements => {
            return elements.map(element => element.textContent.trim());
        });

        let numberOfMakes = getNumberValueAfterKey(result, "Post a Make");
        if (!numberOfMakes.ok) {
            return { ok: false, error: numberOfMakes.error };
        }

        // return success
        return { ok: true, data: numberOfMakes.data };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

async function getNumberOfRemixes(browserPage) {
    try {
        // #tabs > li:nth-child(3) > a > small
        let result = await browserPage.$$eval("#tabs > li > a > small", elements => {
            return elements.map(element => element.textContent.trim());
        });

        let numberOfRemixes = getNumberFromString(result[3], "remixes");
        if (!numberOfRemixes.ok) {
            return { ok: false, error: numberOfRemixes.error };
        }

        // return success
        return { ok: true, data: numberOfRemixes.data  };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

async function getNumberOfCollections(browserPage) {
    try {
        // #tabs > li:nth-child(3) > a > small
        let result = await browserPage.$$eval("#tabs > li > a > small", elements => {
            return elements.map(element => element.textContent.trim());
        });

        let numberOfCollections = getNumberFromString(result[4], "collections");
        if (!numberOfCollections.ok) {
            return { ok: false, error: numberOfCollections.error };
        }

        // return success
        return { ok: true, data: numberOfCollections.data  };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

async function getNumberOfComments(browserPage, numberOfMakes) {
    try {
        // #tabs > li:nth-child(3) > a > small
        let result = await browserPage.$$eval("#tabs > li > a > small", elements => {
            return elements.map(element => element.textContent.trim());
        });

        let numberOfComments = getNumberFromString(result[1], "comments");
        if (!numberOfComments.ok) {
            return { ok: false, error: numberOfComments.error };
        }

        numberOfComments.data = numberOfComments.data - numberOfMakes;

        // return success
        return { ok: true, data: numberOfComments.data  };
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
function getNumberValueAfterKey(elements, name) {
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

        if (value.startsWith("Posta")) {
            value = 0
        }

        // return value or 0 if not found
        return { ok: true, data: value || 0 };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

function getNumberFromString(element, name) {
    // remove key from element
    element = element.replace(name, "");

    // remove blanks from value
    element = element.replace(/\s/g, '');

    let multiplier = 1;

    // check if value is in K
    if (element.endsWith("k")) {
        multiplier = 1000;
        element = element.substring(0, element.length - 1);
    } else  if (element.endsWith("m")) {
        multiplier = 1000000;
        element = element.substring(0, element.length - 1);
    }

    try {
        let value = multiplier > 1 ? Math.round(parseFloat(element) * multiplier) : parseInt(element);

        // return value or 0 if not found
        return { ok: true, data: value || 0 };
    } catch (error) {
        return { ok: false, error: error };
    }
}

module.exports = {
    getDesigns,
    getDesign
}
