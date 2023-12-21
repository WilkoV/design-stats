const puppeteer = require("puppeteer");
const slowMoInitialValue = 150;
const slowMoIncreaseValue = 100;
const slowMoDecreaseValue = 50;

let browser = null;
let browserPage = null;
let slowMoValue = slowMoInitialValue;

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
                slowMo: slowMoValue,
                devtools: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
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

async function increaseSlowMoValue() {
    await closeBrowser();

    slowMoValue += slowMoIncreaseValue;
}


async function decreaseSlowMoValue() {
    if (slowMoValue <= slowMoInitialValue) {
        return;
    }
    
    await closeBrowser();

    slowMoValue -= slowMoDecreaseValue;
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

/**
 * Scroll down a puppeteer page until the last element is visible
 * 
 * Source: https://github.com/chenxiaochun/blog/issues/38
 * 
 * @param {*} browserPage 
 */
 async function autoScroll(browserPage) {
    // Set viewport size for more consistent results
    await browserPage.setViewport({
        width: 1200,
        height: 800
    });

    // Scroll down to the bottom of the browserPage
    await browserPage.evaluate(async () => {
        // eslint-disable-next-line no-unused-vars
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            // eslint-disable-next-line no-undef
            var timer = setInterval(() => {
                // eslint-disable-next-line no-undef
                var scrollHeight = document.body.scrollHeight;
                // eslint-disable-next-line no-undef
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    // eslint-disable-next-line no-undef
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

module.exports = {
    openBrowserPage,
    closeBrowser,
    autoScroll,
    increaseSlowMoValue,
    decreaseSlowMoValue
}
