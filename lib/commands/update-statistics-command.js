const commander = require("commander");
const ora = require("ora");

const constants = require("../constants");
const thingiverse = require("../sites/thingiverse");
const printable = require("../sites/printable");
const cults = require("../sites/cults");
const browser = require("../sites/browser");
const db = require("../persistence/db");
const designsSources = require("../persistence/designs-sources-persistence");
const persistence = require("../persistence/statistics-persistence");
const util = require("../util");

function getCommand() {
    // Create merge sites command
    return new commander.Command("updateStatistics")
        .description("Get data for the configured designs / sources and update the statistics")
        .option("-c, --config <configFile>", "config file path", "config/.env")
        .option("-i, --importDate <importDate>", "import date (format: YYYY/MM/DD)", util.formatDate(new Date()))
        .option("-d, --designId <designId>", "database id of the design")
        .addOption(new commander.Option('-s, --source <sourceType>', 'limit import to one source').choices([constants.SOURCE_THINGIVERSE, constants.SOURCE_CULTS, constants.SOURCE_PRINTABLE]))
        .addOption(new commander.Option('-z, --initializeWithZero', 'initialize statistics with zero').hideHelp())
        .action(handler);
}

async function handler(options) {
    // initialize spinner
    let spinner = ora("Loading configuration").start();

    // 
    // validate cli arguments
    // 

    // validate import date
    let validationResult = createFormattedImportDateFromString(options.importDate);
    if (!validationResult.ok) {
        commander.error(validationResult.error);
    }

    const formattedImportDate = validationResult.data;
    const formattedCurrentDate = util.formatDate(new Date());
    let importDate = new Date(validationResult.data);

    spinner.succeed("importDate is set to " + formattedImportDate);

    if (options.designId != "") {
        spinner.succeed("Setting design ID filter to " + options.designId);
    }

    if (options.source != "") {
        spinner.succeed("Setting source filter to " + options.source);
    }

    // 
    // initialize process
    // 

    // load config into environment variables
    const configResult = util.loadConfiguration(options.config);
    if (!configResult.ok) {
        // set spinner to failed
        spinner.fail("Failed to load configuration");
        // let commander exit the process with an error
        commander.error(configResult.error);
    }

    // environment variables are loaded, set spinner to success
    spinner.succeed("Configuration loaded");

    // check schema version
    spinner.text = "Checking schema version";
    let schemaVersionResult = await db.checkSchemaVersion();
    if (!schemaVersionResult.ok) {
        spinner.fail("Schema version mismatch");
        commander.error(schemaVersionResult.error);
    }

    spinner.succeed("Schema version is correct");

    if (options.initializeWithZero) {
        spinner = ora("Initializing statistic record for designId ${options.designId} with zeros").start();

        let initResult = await initializeStatisticsWithZero(options.designId, options.source, importDate);
        if (!initResult.ok) {
            spinner.fail();
            commander.error(initResult.error);
        }

        spinner.succeed("Statistics initialized");
        // close the browser
        await browser.closeBrowser();

        // TODO: write error file and provide an option to process the error file as import for the next run

        // release to db pool
        db.endPool();

        return;
    }

    // 
    // initialize process list
    // 

    // get all designs and sources
    spinner = ora("Getting sources").start();

    let designsSourcesResult = await designsSources.findAllDesignSources(options.designId, options.source);
    if (!designsSourcesResult.ok) {
        spinner.fail("Getting designs and sources");
        commander.error(designsSourcesResult.error);
    }

    let activeList = designsSourcesResult.data.filter(element => !element.inactive);

    const maxSourceIndex = activeList.length;
    spinner.succeed("Got " + maxSourceIndex + " sources");

    // add for each source a entry to the processables map
    let processables = new Map;
    for (let i = 0; i < maxSourceIndex; i++) {
        processables.set(i, true);
    }

    let retryCounter = 0;
    let maxRetries = 10;

    // 
    // process the sources 
    // 

    // do while retry counter is less than max retries or there are retries left
    do {
        // calculate if the retry prefix should be shown or not
        let showRetries = retryCounter == 0 ? false : true;

        // iterate over all designs and sources
        for (let sourceIndex = 0; sourceIndex < maxSourceIndex; sourceIndex++) {
            // current designs source
            const source = activeList[sourceIndex];

            // check if current design / source is in process list
            if (!processables.has(sourceIndex)) {
                // it is not in process list, skip it
                continue;
            }

            // initialize spinner
            spinner = ora(util.renderSpinnerPrefix(sourceIndex, maxSourceIndex, showRetries) + source.title + " from " + source.source).start();

            // ignore inaktive entries
            if (source.inactive == true) {
                // remove sourceIndex from processables
                processables.delete(sourceIndex);

                // update spinner
                spinner.succeed(util.renderSpinnerPrefix(sourceIndex, maxSourceIndex, showRetries) + source.title + " from " + source.source + " is inactive");

                // process next entry
                continue;
            }

            // set import type to initialize if there are no imports for the current source
            let importType = constants.IMPORT_TYPE_REGULAR;

            // get total data points from the web / sources
            spinner.text = util.renderSpinnerPrefix(sourceIndex, maxSourceIndex, showRetries) + source.title + " from " + source.source + " --> getting data from web";

            const totalDataPointsResult = await getTotalDataPoints(source.source, source.source_id);
            if (!totalDataPointsResult.ok) {
                showErrorSpinner(spinner, sourceIndex, maxSourceIndex, retryCounter, maxRetries, showRetries, source.title, source.source, totalDataPointsResult.error);
                continue;
            }

            let totalDataPoints = totalDataPointsResult.data;

            // get import type
            const importTypeResult = await getImportType(importDate, source.design_id, source.source, formattedImportDate, formattedCurrentDate);
            if (!importTypeResult.ok) {
                showErrorSpinner(spinner, sourceIndex, maxSourceIndex, retryCounter, maxRetries, showRetries, source.title, source.source, importTypeResult.error);
                continue;
            }

            importType = importTypeResult.data;

            // get today's data points
            spinner.text = util.renderSpinnerPrefix(sourceIndex, maxSourceIndex, showRetries) + source.title + " from " + source.source + " --> calculating todays data points";

            const todaysDataPointsResult = await getTodaysDataPoints(importDate, source.design_id, source.source, importType, totalDataPoints);
            if (!todaysDataPointsResult.ok) {
                showErrorSpinner(spinner, sourceIndex, maxSourceIndex, retryCounter, maxRetries, showRetries, source.title, source.source, todaysDataPointsResult.error);
                continue;
            }

            let dailyDataPoints = todaysDataPointsResult.data;

            // get statistics for the different time periods
            spinner.text = util.renderSpinnerPrefix(sourceIndex, maxSourceIndex, showRetries) + source.title + " from " + source.source + " --> calculating statistics";

            let statisticsResult = await getStatistics(importDate, source.design_id, source.source, importType, totalDataPoints, dailyDataPoints);
            if (!statisticsResult.ok) {
                showErrorSpinner(spinner, sourceIndex, maxSourceIndex, retryCounter, maxRetries, showRetries, source.title, source.source, statisticsResult.error);
                continue;
            }

            let statistics = statisticsResult.data;

            // insert data into all statistic tables
            spinner.text = util.renderSpinnerPrefix(sourceIndex, maxSourceIndex, showRetries) + source.title + " from " + source.source + " --> storing data";

            let importData = new persistence.ImportData(importDate, source.design_id, source.source, importType, totalDataPoints, dailyDataPoints);

            let insertOneStatisticsResult = await persistence.insertOneStatistic(importData, statistics);
            if (insertOneStatisticsResult.ok === false) {
                showErrorSpinner(spinner, sourceIndex, maxSourceIndex, retryCounter, maxRetries, showRetries, source.title, source.source, insertOneStatisticsResult.error);
                continue;
            }

            // decrease slowModeValue
            if (sourceIndex % 10 === 0) {
                await browser.decreaseSlowMoValue();
            }

            // remove sourceIndex from processables
            processables.delete(sourceIndex);

            // item is processed successfully
            spinner.succeed(util.renderSpinnerPrefix(sourceIndex, maxSourceIndex, showRetries) + source.title + " from " + source.source + " processed");
        }

        // check if there are sources left in process list, if yes and retry counter is less than max retries, retry
    } while (processables.size > 0 && retryCounter++ < maxRetries);

    // close the browser
    await browser.closeBrowser();

    // TODO: write error file and provide an option to process the error file as import for the next run

    // release to db pool
    db.endPool();
}

async function initializeStatisticsWithZero(designId, source, importDate) {
    if (!designId) {
        return { ok: false, error: "No designId provided" };
    }

    if (!source) {
        return { ok: false, error: "No source provided" };
    }

    // check if the design has already imports
    const checkResult = await persistence.hasImports(importDate, designId, source);
    if (!checkResult.ok) {
        return { ok: false, error: checkResult.error };
    }

    if (checkResult.data == true) {
        return { ok: false, error: "Design has already imports" };
    }

    let importData = new persistence.ImportData(importDate, designId, source, constants.IMPORT_TYPE_INITIAL);
    let statistics = new Map();

    statistics.set(constants.STATISTICS_TYPE_DOWNLOADS, new persistence.StatisticData(constants.STATISTICS_TYPE_DOWNLOADS));
    statistics.set(constants.STATISTICS_TYPE_LIKES, new persistence.StatisticData(constants.STATISTICS_TYPE_LIKES));
    statistics.set(constants.STATISTICS_TYPE_VIEWS, new persistence.StatisticData(constants.STATISTICS_TYPE_VIEWS));
    statistics.set(constants.STATISTICS_TYPE_MAKES, new persistence.StatisticData(constants.STATISTICS_TYPE_MAKES));
    statistics.set(constants.STATISTICS_TYPE_REMIXES, new persistence.StatisticData(constants.STATISTICS_TYPE_REMIXES));
    statistics.set(constants.STATISTICS_TYPE_COMMENTS, new persistence.StatisticData(constants.STATISTICS_TYPE_COMMENTS));
    statistics.set(constants.STATISTICS_TYPE_COLLECTIONS, new persistence.StatisticData(constants.STATISTICS_TYPE_COLLECTIONS));

    let insertOneStatisticsResult = await persistence.insertOneStatistic(importData, statistics);
    if (insertOneStatisticsResult.ok === false) {
        return { ok: false, error: insertOneStatisticsResult.error };
    }

    return { ok: true, data: true };
}

/**
 * Show warning or error spinner depending on retry counter
 * 
 * @param {*} spinner spinner object
 * @param {*} sourceIndex current position in source list
 * @param {*} maxSourceIndex maximum position in source list
 * @param {*} retryCounter current retry counter
 * @param {*} maxRetries maximum retries
 * @param {*} showRetries show retry label (not needed for first try)
 * @param {*} title title of the design
 * @param {*} source location of the design
 * @param {*} error error object
 */
function showErrorSpinner(spinner, sourceIndex, maxSourceIndex, retryCounter, maxRetries, showRetries, title, source, error) {
    if (retryCounter < maxRetries - 1) {
        spinner.warn(util.renderSpinnerPrefix(sourceIndex, maxSourceIndex, showRetries) + title + " from " + source + "--> error: " + error + " --> retrying later");
    } else {
        spinner.fail(util.renderSpinnerPrefix(sourceIndex, maxSourceIndex, showRetries) + title + " from " + source + "--> error: " + error);
    }
}

/**
 * Get the total data points for a design + source from the web
 * 
 * @param {string} source location of the design (e.g. Thingiverse, Cults3d, Printables, etc.)
 * @param {string} source_id identifier of the design (e.g. thingiverse_id, cults3d_id, printables_id, etc.)
 * @returns DataPoints object with total data points
 */
async function getTotalDataPoints(source, source_id) {
    // get details for the current source
    const detailsResult = await getDetailsFromWeb(source, source_id);
    // check result
    if (!detailsResult.ok) {
        await browser.increaseSlowMoValue();

        return { ok: false, error: detailsResult.error };
    }

    // map details to data points
    let dataPoints = new persistence.DataPoints(
        detailsResult.data.downloads,
        detailsResult.data.likes,
        detailsResult.data.views,
        detailsResult.data.makes,
        detailsResult.data.remixes,
        detailsResult.data.comments,
        detailsResult.data.collections
    )

    // return data points
    return { ok: true, data: dataPoints };
}

/**
 * Calculate the data points for a design + source for the import date (normally today)
 * @param {date} importDate date of the import
 * @param {integer} designId database id of the design
 * @param {string} source location of the design (e.g. Thingiverse, Cults3d, Printables, etc.)
 * @param {string} importType type of import (e.g. initial, regular, adjusted date)
 * @param {*} totalDataPoints data points from the web
 * @returns {ok: boolean, data: DataPoints, error: string} ok = true will return the import type as data, otherwise false and the error message
 */
async function getTodaysDataPoints(importDate, designId, source, importType, totalDataPoints) {
    // initialize data points with zeros
    let dataPoints = new persistence.DataPoints();

    // depending on the importType calculate the data points
    if (importType == constants.IMPORT_TYPE_REGULAR || importType == constants.IMPORT_TYPE_ADJUSTED_IMPORT_DATE) {
        // get the data points for the import date from previous import
        const findPreviousImportResult = await persistence.findPreviousImport(importDate, designId, source);

        // check if one row was found
        if (findPreviousImportResult.ok === false) {
            // no previous import found, return error
            return { ok: false, error: findPreviousImportResult.error };
        }

        // // check that current downloads / views are not smaller than the previous ones
        // if (totalDataPoints.downloads < findPreviousImportResult.data.downloads) {
        //     return { ok: false, error: "Current download data points are smaller than previous data points (c: " + totalDataPoints.downloads + " p: " +  findPreviousImportResult.data.downloads};
        // }

        // if (totalDataPoints.views < findPreviousImportResult.data.views) {
        //     return { ok: false, error: "Current view data points are smaller than previous data points (c: " + totalDataPoints.views + " p: " +  findPreviousImportResult.data.views};
        // }

        // TODO: compare all data points even if they can shrink naturally. Give user an option to ignore this

        // calculate today's data points
        dataPoints.downloads = totalDataPoints.downloads - findPreviousImportResult.data.downloads;
        dataPoints.likes = totalDataPoints.likes - findPreviousImportResult.data.likes;
        dataPoints.views = totalDataPoints.views - findPreviousImportResult.data.views;
        dataPoints.makes = totalDataPoints.makes - findPreviousImportResult.data.makes;
        dataPoints.remixes = totalDataPoints.remixes - findPreviousImportResult.data.remixes;
        dataPoints.comments = totalDataPoints.comments - findPreviousImportResult.data.comments;
        dataPoints.collections = totalDataPoints.collections - findPreviousImportResult.data.collections;
    }

    // return data points
    return { ok: true, data: dataPoints };
}

/**
 * calculate the import type (initial, regular, adjusted date) for the design + source + import date
 * 
 * @param {date} importDate date of the import
 * @param {integer} designId database id of the design
 * @param {string} source location of the design (e.g. Thingiverse, Cults3d, Printables, etc.)
 * @param {string} formattedImportDate formatted date of the import
 * @param {string} formattedCurrentDate formatted date of the current date
 * @returns {ok: boolean, data: DataPoints, error: string} ok = true will return the import type as data, otherwise false and the error message
 */
async function getImportType(importDate, designId, source, formattedImportDate, formattedCurrentDate) {
    let importType = constants.IMPORT_TYPE_REGULAR;

    // check if there are imports for the current source in the database
    const hasImportsResult = await persistence.hasImports(importDate, designId, source);
    if (hasImportsResult.ok === false) {
        return { ok: false, error: hasImportsResult.error };
    }

    if (hasImportsResult.data === false) {
        // no imports for the current source in the database, set import type to initial
        importType = constants.IMPORT_TYPE_INITIAL;
    } else if (formattedCurrentDate != formattedImportDate) {
        // there are imports for the current source in the database, but the import date is not today, set import type to adjusted import date
        importType = constants.IMPORT_TYPE_ADJUSTED_IMPORT_DATE;
    }

    return { ok: true, data: importType };
}

/**
 * calculate the statistic data based on the data from the web and from the database
 * 
 * @param {date} importDate date of the import
 * @param {integer} designId database id of the design
 * @param {string} source location of the design (e.g. Thingiverse, Cults3d, Printables, etc.)
 * @param {string} importType type of import (e.g. initial, regular, adjusted date)
 * @param {DataPoints} totalDataPoints data points from the web
 * @param {DataPoints} dailyDataPoints today's data points
 * @returns {ok: boolean, data: DataPoints, error: string} ok = true will return the statistics as data, otherwise false and the error message
 */
async function getStatistics(importDate, designId, source, importType, totalDataPoints, dailyDataPoints) {
    // get statistics
    let statistics = new Map();

    // is the import type initial?
    if (importType == constants.IMPORT_TYPE_INITIAL) {
        // initialize stats with 0 values
        statistics.set(constants.STATISTICS_TYPE_DOWNLOADS, new persistence.StatisticData(constants.STATISTICS_TYPE_DOWNLOADS));
        statistics.set(constants.STATISTICS_TYPE_LIKES, new persistence.StatisticData(constants.STATISTICS_TYPE_LIKES));
        statistics.set(constants.STATISTICS_TYPE_VIEWS, new persistence.StatisticData(constants.STATISTICS_TYPE_VIEWS));
        statistics.set(constants.STATISTICS_TYPE_MAKES, new persistence.StatisticData(constants.STATISTICS_TYPE_MAKES));
        statistics.set(constants.STATISTICS_TYPE_REMIXES, new persistence.StatisticData(constants.STATISTICS_TYPE_REMIXES));
        statistics.set(constants.STATISTICS_TYPE_COMMENTS, new persistence.StatisticData(constants.STATISTICS_TYPE_COMMENTS));
        statistics.set(constants.STATISTICS_TYPE_COLLECTIONS, new persistence.StatisticData(constants.STATISTICS_TYPE_COLLECTIONS));

        // return initial stats
        return { ok: true, data: statistics };
    }

    //
    // get statistics for the different data points and periods.
    //

    // last 7 days
    let sevenDaysResult = await persistence.findDailyStatisticsSumsForPeriod(importDate, designId, source, 7, dailyDataPoints);
    if (sevenDaysResult.ok === false) {
        // return db error
        return { ok: false, error: sevenDaysResult.error };
    }

    // last 30 days
    let thirtyDaysResult = await persistence.findDailyStatisticsSumsForPeriod(importDate, designId, source, 30, dailyDataPoints);
    if (thirtyDaysResult.ok === false) {
        // return db error
        return { ok: false, error: thirtyDaysResult.error };
    }

    // this month
    let dayInMonth = importDate.getDate();
    let thisMonthResult = await persistence.findDailyStatisticsSumsForPeriod(importDate, designId, source, dayInMonth, dailyDataPoints);
    if (thisMonthResult.ok === false) {
        // return db error
        return { ok: false, error: thisMonthResult.error };
    }

    // last 365 days
    let last365DaysResult = await persistence.findDailyStatisticsSumsForPeriod(importDate, designId, source, 365, dailyDataPoints);
    if (last365DaysResult.ok === false) {
        // return db error
        return { ok: false, error: last365DaysResult.error };
    }

    // this year
    let dayInYears = util.getDayInYear(importDate);
    let thisYearResult = await persistence.findDailyStatisticsSumsForPeriod(importDate, designId, source, dayInYears, dailyDataPoints);
    if (thisYearResult.ok === false) {
        // return db error
        return { ok: false, error: thisYearResult.error };
    }

    // map the results from the queries to the statistics map
    statistics.set(constants.STATISTICS_TYPE_DOWNLOADS, new persistence.StatisticData(constants.STATISTICS_TYPE_DOWNLOADS, dailyDataPoints.downloads, sevenDaysResult.data.downloads, thirtyDaysResult.data.downloads, thisMonthResult.data.downloads, last365DaysResult.data.downloads, thisYearResult.data.downloads, totalDataPoints.downloads));
    statistics.set(constants.STATISTICS_TYPE_LIKES, new persistence.StatisticData(constants.STATISTICS_TYPE_LIKES, dailyDataPoints.likes, sevenDaysResult.data.likes, thirtyDaysResult.data.likes, thisMonthResult.data.likes, last365DaysResult.data.likes, thisYearResult.data.likes, totalDataPoints.likes));
    statistics.set(constants.STATISTICS_TYPE_VIEWS, new persistence.StatisticData(constants.STATISTICS_TYPE_VIEWS, dailyDataPoints.views, sevenDaysResult.data.views, thirtyDaysResult.data.views, thisMonthResult.data.views, last365DaysResult.data.views, thisYearResult.data.views, totalDataPoints.views));
    statistics.set(constants.STATISTICS_TYPE_MAKES, new persistence.StatisticData(constants.STATISTICS_TYPE_MAKES, dailyDataPoints.makes, sevenDaysResult.data.makes, thirtyDaysResult.data.makes, thisMonthResult.data.makes, last365DaysResult.data.makes, thisYearResult.data.makes, totalDataPoints.makes));
    statistics.set(constants.STATISTICS_TYPE_REMIXES, new persistence.StatisticData(constants.STATISTICS_TYPE_REMIXES, dailyDataPoints.remixes, sevenDaysResult.data.remixes, thirtyDaysResult.data.remixes, thisMonthResult.data.remixes, last365DaysResult.data.remixes, thisYearResult.data.remixes, totalDataPoints.remixes));
    statistics.set(constants.STATISTICS_TYPE_COMMENTS, new persistence.StatisticData(constants.STATISTICS_TYPE_COMMENTS, dailyDataPoints.comments, sevenDaysResult.data.comments, thirtyDaysResult.data.comments, thisMonthResult.data.comments, last365DaysResult.data.comments, thisYearResult.data.comments, totalDataPoints.comments));
    statistics.set(constants.STATISTICS_TYPE_COLLECTIONS, new persistence.StatisticData(constants.STATISTICS_TYPE_COLLECTIONS, dailyDataPoints.collections, sevenDaysResult.data.collections, thirtyDaysResult.data.collections, thisMonthResult.data.collections, last365DaysResult.data.collections, thisYearResult.data.collections, totalDataPoints.collections));

    // return the statistics
    return { ok: true, data: statistics };
}

/**
 * Create a date from a string.
 * 
 * @param {*} dateString 
 * @returns {ok: boolean, data: Date, error: string}
 */
function createFormattedImportDateFromString(dateString) {
    try {
        const date = new Date(dateString);
        return { ok: true, data: util.formatDate(date) };
    } catch (error) {
        return { ok: false, error: error };
    }
}

/**
 * Retrieve the data for a design from the source / web.
 * 
 * @param {string} source Source of the design.
 * @param {string} source_id Source id of the design on the website.
 * @returns {ok: boolean, data: string, error: string} ok is true if data could be found and false if not. 
 */
async function getDetailsFromWeb(source, source_id) {
    // initialize request result
    let detailsResult = null;

    // call api/webs craping function based on source type
    if (source == constants.SOURCE_THINGIVERSE) {
        // get source details from thingiverse
        detailsResult = await thingiverse.getDesign(source_id);
    } else if (source == constants.SOURCE_CULTS) {
        // get source details from cults
        detailsResult = await cults.getDesign(source_id);
    } else if (source == constants.SOURCE_PRINTABLE) {
        // get source details from printable
        detailsResult = await printable.getDesign(source_id);
    } else {
        // unknown source, return error
        return { ok: false, error: constants.PROCESSING_STATUS_FAILED_UNKNOWN_SOURCE };
    }

    // check result
    if (!detailsResult.ok) {
        // await delay(5000);
        // an error occurred, return error
        return { ok: false, error: detailsResult.error };
    }

    // return the details
    return { ok: true, data: detailsResult.data };
}

module.exports = {
    getCommand
}
