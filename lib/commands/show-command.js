const commander = require("commander");
const ora = require("ora");
const { stringify } = require('csv-stringify');
const process = require("process");
const fs = require("fs");
const columnify = require('columnify')
const { EOL } = require('os');

const constants = require("../constants");
const db = require("../persistence/db");
const dsPersistence = require("../persistence/designs-sources-persistence");
const stPersistence = require("../persistence/statistics-persistence");
const util = require("../util");

function getCommand() {
    const queryTypes = [
        constants.QUERY_TYPE_DESIGNS,
        constants.QUERY_TYPE_DESIGN_SOURCES,
        constants.QUERY_TYPE_DAILY_SUMS,
        constants.QUERY_TYPE_MONTHLY_SUMS,
        constants.QUERY_TYPE_YEARLY_SUMS,
        constants.QUERY_TYPE_TOTAL_SUMS,
        constants.QUERY_TYPE_DESIGN_DAILY_SUMS,
        constants.QUERY_TYPE_DESIGN_MONTHLY_SUMS,
        constants.QUERY_TYPE_DESIGN_YEARLY_SUMS,
        constants.QUERY_TYPE_DESIGN_TOTAL_SUMS,
        constants.QUERY_TYPE_COMPARE_DAILY_DESIGN_DOWNLOADS,
        constants.QUERY_TYPE_COMPARE_MONTHLY_DESIGN_DOWNLOADS,
        constants.QUERY_TYPE_COMPARE_YEARLY_DESIGN_DOWNLOADS,
        constants.QUERY_TYPE_COMPARE_TOTAL_DESIGN_DOWNLOADS,
        constants.QUERY_TYPE_DESIGN_STATISTICS,
        constants.QUERY_TYPE_SOURCE_STATISTICS
    ];

    // Create merge sites command
    return new commander.Command("show")
        .addArgument(new commander.Argument('<queryType', 'Query to be executed').choices(queryTypes))
        .addOption(new commander.Option("-a, --as <as>", "output format for the result").choices([constants.OUTPUT_FORMAT_CSV, constants.OUTPUT_FORMAT_JSON, constants.OUTPUT_FORMAT_TABLE]).default(constants.OUTPUT_FORMAT_TABLE))
        .option("-c, --config <configFile>", "config file path", "config/.env")
        .option("-d, --designId <designId>", "filter the query by design id")
        .option("-t, --title <title>", "filter the query by title")
        .option("-i, --importDate <importDate>", "filter the query by date (format: YYYY/MM/DD)")
        .option("-l, --limit <limit>", "limit the query to the specified number of results")
        .option("-t, --showZeroRows", "show rows that only contain 0 values", false)
        .option('-w, --writeToFile', 'Write the result to a file', false)
        .option("-b, --baseDirectory <baseDirectory>", "base directory for the result files", "data")
        .addOption(new commander.Option("-s, --source <source>", "filter the query by source" + constants.QUERY_TYPE_DESIGNS).choices([constants.SOURCE_THINGIVERSE, constants.SOURCE_CULTS, constants.SOURCE_PRINTABLE]))
        .addOption(new commander.Option("-y, --statisticType <statisticType>", "filter the query by statistics type").choices([constants.STATISTICS_TYPE_DOWNLOADS, constants.STATISTICS_TYPE_LIKES, constants.STATISTICS_TYPE_VIEWS, constants.STATISTICS_TYPE_MAKES, constants.STATISTICS_TYPE_REMIXES, constants.STATISTICS_TYPE_COMMENTS, constants.STATISTICS_TYPE_COLLECTIONS]))
        .action(handler);
}

async function handler(queryType, options) {
    // format import date from command line
    if (options.importDate) {
        let validationResult = createFormattedImportDateFromString(options.importDate);
        if (!validationResult.ok) {
            commander.error(validationResult.error);
        }

        options.importDate = validationResult.data;
    }

    // initialize spinner
    let spinner = ora("Loading configuration").start();

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

    // execute query
    spinner.start("Executing query " + queryType);

    const executeQueryResult = await executeQuery(queryType, options)
    // check if query execution was successful
    if (!executeQueryResult.ok) {
        db.endPool();
        spinner.fail();
        commander.error(executeQueryResult.error);
    }

    // query execution was successful, set spinner to success
    spinner.succeed("Query executed");

    // write the result to a file or stdout
    const exportDataResult = exportData(executeQueryResult.data, options.as, options.writeToFile, options.baseDirectory, queryType);
    if (!exportDataResult.ok) {
        commander.error(exportDataResult.error);
    }

    // end the pool
    db.endPool();
}

/**
 * Export the data to a file or stdout in the specified format (table, csv, json)
 * 
 * @param {*} data Data to be exported
 * @param {string} outputFormat Output format for the result. Valid values are: table, csv, json (constants.OUTPUT_FORMAT_TABLE, constants.OUTPUT_FORMAT_CSV, constants.OUTPUT_FORMAT_JSON)
 * @param {boolean} writeToFile If true, the result will be written to a file. If false, the result will be written to stdout.
 * @param {string} filePath Path to the file to be written to. /export/ will be added to the path
 * @param {string} queryType Name of the query that was executed. Valid values are constants.QUERY_TYPE_*. The name will be used as part of the file name. 
 * @returns {ok: boolean, error: string}
 */
function exportData(data, outputFormat, writeToFile, filePath, queryType) {
    let formattedData;

    const dateTime = util.formateDateTime(new Date());
    let filename = filePath + "/export/" + queryType + "_" + dateTime + "." + outputFormat;

    // remove double slash or backslash from filename
    filename = filename.replace(/\\\\/g, "");
    filename = filename.replace(/\/\//g, "");

    try {
        // check which output format is requested
        switch (outputFormat) {
            // output format is table
            case constants.OUTPUT_FORMAT_TABLE:
                formattedData = columnify(data, { config: createTableConfig(data) })
                if (writeToFile) {
                    // write the result to a file
                    fs.writeFileSync(filename, formattedData);
                } else {
                    // write the result to stdout
                    process.stdout.write(formattedData);
                    process.stdout.write(EOL);
                }
                break;

            // output format is csv
            case constants.OUTPUT_FORMAT_CSV:
                if (writeToFile) {
                    // write stringify csv to file
                    stringify(data, { header: true }, (err, output) => {
                        if (err) {
                            throw err;
                        }
                        fs.writeFileSync(filename, output);
                    });
                } else {
                    // write stringify csv to stdout
                    stringify(data, { header: true }).pipe(process.stdout);
                }
                break;

            // output format is json
            case constants.OUTPUT_FORMAT_JSON:
                // render json to string
                formattedData = JSON.stringify(data, null, 4);

                if (writeToFile) {
                    // write json to file
                    fs.writeFileSync(filename, formattedData);
                } else {
                    // write json to stdout
                    process.stdout.write(formattedData);
                }
                break;
            
            // output format is unknown
            default:
                // return error
                return { ok: false, error: "Unknown output format: " + outputFormat };
        }
    } catch (error) {
        // return error
        return { ok: false, error: error };
    }

    // return success
    return { ok: true };
}

/**
 * Analyze the data and create a columnify config for the table output format. constants.QUERY_NUMBER_VALUES is used to determine the number of values per row.
 * 
 * @param {*} data Data do be analyzed
 * @returns Configuration for columnify
 */
function createTableConfig(data) {
    // record to be used for the columnify config
    let record = data[0];
    // result configuration
    let config = {};

    // iterate over all attributes of the record
    for (const property in record) {
        // check if property is in constants.QUERY_NUMBER_VALUES
        if (constants.QUERY_NUMBER_VALUES.includes(property)) {
            // numbers should be printed right aligned
            config[property] = { align: "right" };
        } else {
            // everything else should be left aligned
            config[property] = { align: "left" };
        }
    }

    // return the config
    return config;
}

/**
 * Execute a database query and return the data set from the database.
 * @param {string} queryType Name of the query to be executed. Valid values are constants.QUERY_TYPE_*.
 * @param {*} options List of command line options
 * @returns {ok: boolean, data: any, error: string} ok: true + data if the query was successful, ok: false + error if the query was not successful
 */
async function executeQuery(queryType, options) {
    let queryResult;

    // case query type and execute the associated query
    switch (queryType) {
        case constants.QUERY_TYPE_DESIGNS:
            queryResult = await dsPersistence.findAllDesigns(options.designId, options.title, options.limit);
            break;
        case constants.QUERY_TYPE_DESIGN_SOURCES:
            queryResult = await dsPersistence.findAllDesignSources(options.designId, options.source, options.title, options.limit);
            break;
        case constants.QUERY_TYPE_DAILY_SUMS:
            queryResult = await stPersistence.findDeltaSums("daily", options.showZeroRows, options.source, options.importDate, options.limit);
            break;
        case constants.QUERY_TYPE_MONTHLY_SUMS:
            queryResult = await stPersistence.findDeltaSums("monthly", options.showZeroRows, options.source, options.importDate, options.limit);
            break;
        case constants.QUERY_TYPE_YEARLY_SUMS:
            queryResult = await stPersistence.findDeltaSums("yearly", options.showZeroRows, options.source, options.importDate, options.limit);
            break;
        case constants.QUERY_TYPE_TOTAL_SUMS:
            queryResult = await stPersistence.findTotals(options.showZeroRows, options.source, options.limit);
            break;
        case constants.QUERY_TYPE_DESIGN_DAILY_SUMS:
            queryResult = await stPersistence.findDesignDeltaSums("daily", options.showZeroRows, options.designId, options.title, options.source, options.importDate, options.limit);
            break;
        case constants.QUERY_TYPE_DESIGN_MONTHLY_SUMS:
            queryResult = await stPersistence.findDesignDeltaSums("monthly", options.showZeroRows, options.designId, options.title, options.source, options.importDate, options.limit);
            break;
        case constants.QUERY_TYPE_DESIGN_YEARLY_SUMS:
            queryResult = await stPersistence.findDesignDeltaSums("yearly", options.showZeroRows, options.designId, options.title, options.source, options.importDate, options.limit);
            break;
        case constants.QUERY_TYPE_DESIGN_TOTAL_SUMS:
            queryResult = await stPersistence.findDesignTotals(options.showZeroRows, options.designId, options.title, options.source, options.limit);
            break;
        case constants.QUERY_TYPE_COMPARE_DAILY_DESIGN_DOWNLOADS:
            queryResult = await stPersistence.findCompareDesignDownloads("daily", options.showZeroRows, options.designId, options.title, options.importDate, options.limit);
            break;
        case constants.QUERY_TYPE_COMPARE_MONTHLY_DESIGN_DOWNLOADS:
            queryResult = await stPersistence.findCompareDesignDownloads("monthly", options.showZeroRows, options.designId, options.title, options.importDate, options.limit);
            break;
        case constants.QUERY_TYPE_COMPARE_YEARLY_DESIGN_DOWNLOADS:
            queryResult = await stPersistence.findCompareDesignDownloads("yearly", options.showZeroRows, options.designId, options.title, options.importDate, options.limit);
            break;
        case constants.QUERY_TYPE_COMPARE_TOTAL_DESIGN_DOWNLOADS:
            queryResult = await stPersistence.findCompareDesignDownloadsTotals("total", options.showZeroRows, options.designId, options.title, options.limit);
            break;
        case constants.QUERY_TYPE_DESIGN_STATISTICS:
            queryResult = await stPersistence.findDesignStatistics(options.showZeroRows, options.designId, options.title, options.source, options.statisticType, options.date, options.limit);
            break;
        case constants.QUERY_TYPE_SOURCE_STATISTICS:
            queryResult = await stPersistence.findSourceStatistics(options.showZeroRows, options.source, options.statisticType, options.date, options.limit);
            break;
        default: return { ok: false, error: "Invalid query type" };
    }

    // check if the query was successful
    if (!queryResult.ok) {
        // not successful, return error
        return { ok: false, error: queryResult.error };
    }

    // check if the query returned no data
    if (queryResult.data.length == 0) {
        // no data found, return error
        return { ok: false, error: "No data found" };
    }

    // return the data from the database
    return { ok: true, data: queryResult.data };
}

/**
 * Parse the date from the command line options and return the date object
 * 
 * @param {string} dateString Date string to be parsed
 * @returns returns the date object 
 */
function createFormattedImportDateFromString(dateString) {
    try {
        // parse the date string
        const date = new Date(dateString);
        // return the date object
        return { ok: true, data: util.formatDate(date, "/") };
    } catch (error) {
        // Convert failed, return error
        return { ok: false, error: error };
    }
}

module.exports = {
    getCommand
}
