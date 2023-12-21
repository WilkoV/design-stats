const commander = require("commander");
const ora = require("ora");

const constants = require("../constants");
const db = require("../persistence/db");
const statistics = require("../persistence/statistics-persistence");
const designSources = require("../persistence/designs-sources-persistence")
const util = require("../util");

function getCommand() {
    // Create merge sites command
    return new commander.Command("recalculateStatistics")
        .description("Recalculated statistics based on the imports table")
        .option("-c, --config <configFile>", "config file path", "config/.env")
        .addOption(new commander.Option('-s, --source <sourceType>', 'limit import to one source').choices([constants.SOURCE_THINGIVERSE, constants.SOURCE_CULTS, constants.SOURCE_PRINTABLE]))
        .action(handler);
}

async function handler(options) {
    // 
    // initialize process
    // 

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

    // check schema version
    spinner.text = "Checking schema version";
    let schemaVersionResult = await db.checkSchemaVersion();
    if (!schemaVersionResult.ok) {
        spinner.fail("Schema version mismatch");
        commander.error(schemaVersionResult.error);
    }

    // iterate over sources

    spinner.text = "Getting all sources"
    const designsSourcesResult = await designSources.findAllDesignSources("", options.source);
    if (!designsSourcesResult.ok) {
        spinner.fail("Can not retrieve sources from DB");
        commander.error(designsSourcesResult.error);
    }

    const maxSourceIndex = designsSourcesResult.data.length;

    for (let sourceIndex = 0; sourceIndex < maxSourceIndex; sourceIndex++) {
        const source = designsSourcesResult.data[sourceIndex];

        spinner = ora(util.renderSpinnerPrefix(sourceIndex, maxSourceIndex, false) + source.design_id + " " + source.title + " from " + source.source).start();

        // Check for missing records in imports and fix them
        const fixImportsResult = await fixImportsTable(source);
        if (fixImportsResult.ok === false) {
            spinner.fail(fixImportsResult.error);
            commander.error(fixImportsResult.error);
        }

        // Retrieve fixed imports
        const findImportsResult = await statistics.findAllImportsForADesignFromASource(source.source, source.design_id);
        if (!findImportsResult.ok) {
            spinner.fail("Can not retrieve data from db: " + findImportsResult.error);
            commander.error(findImportsResult.error);
        }

        const imports = findImportsResult.data;

        // Recalculated daily stats
        const recalculatedDailyStatsResult = await recalculatedDailyStats(imports);
        if (recalculatedDailyStatsResult.ok === false) {
            spinner.fail(recalculatedDailyStatsResult.error);
            commander.error(recalculatedDailyStatsResult.error);
        }

        const recalculateStatsResults = await recalculateStats(recalculatedDailyStatsResult.data);
        // if (recalculateStatsResults.ok === false) {
        //     spinner.fail(recalculateStatsResults.error);
        //     commander.error(recalculateStatsResults.error);
        // }

        spinner.succeed();
    }

    db.endPool();
}

async function recalculateStats(dailyStats) {
    const statisticTypes = ['downloads', 'likes', 'views', 'makes', 'remixes', 'comments', 'collections'];
    const stats = [];

    const uniqueHelper = new Set();

    for (let helperIndex = 0; helperIndex < dailyStats.length; helperIndex++) {
        const dailyStat = dailyStats[helperIndex];
        const importDate = dailyStat.importDate;

        const year = new Date(importDate).getFullYear();
        let month = new Date(importDate).getMonth();

        const currentYear = new Date(importDate).getFullYear();
        let currentMonth = new Date().getMonth();
        
        const firstInMonth = new Date(year, month, 1);
        const lastInMonth = new Date(year, month, 0);
        
        let last30d = new Date(importDate);
        last30d.setDate(last30d.getDate() - 30);
        
        let last7d = new Date(importDate);
        last7d.setDate(last7d.getDate() - 7);
        
        month = month + 1;
        currentMonth = currentMonth + 1;

        if (helperIndex === dailyStats.length - 1) {
            uniqueHelper.add(year + "|" + month + "|" + firstInMonth + "|" + lastInMonth + "|" + last30d  + "|" + last7d  + "|" + dailyStat.importDate);
            continue;
        } else if (year === currentYear && month === currentMonth) {
            continue;
        } else {
            uniqueHelper.add(year + "|" + month + "|" + firstInMonth + "|" + lastInMonth + "|"  + "|" + "|");
        }

    }


}

async function recalculatedDailyStats(imports) {
    const maxImportsIndex = imports.length;
    const dailyStats = [];

    for (let importsIndex = 0; importsIndex < maxImportsIndex; importsIndex++) {

        let currentImport = imports[importsIndex];

        // check inf import type is "initial"
        if (currentImport.import_type == "initial") {
            // initialize daily statistics
            dailyStats.push(
                {
                    importDate: currentImport.import_date,
                    designId: currentImport.design_id,
                    source: currentImport.source,
                    importType: currentImport.import_type,
                    downloads: 0,
                    likes: 0,
                    views: 0,
                    makes: 0,
                    remixes: 0,
                    comments: 0,
                    collections: 0
                }
            );

            // process next import
            continue;
        }

        // regular case
        // get data from previous day
        const previousImport = imports[importsIndex - 1];

        dailyStats.push(
            {
                importDate: currentImport.import_date,
                designId: currentImport.design_id,
                source: currentImport.source,
                importType: currentImport.import_type,
                downloads: currentImport.downloads - previousImport.downloads,
                likes: currentImport.likes - previousImport.likes,
                views: currentImport.views - previousImport.views,
                makes: currentImport.makes - previousImport.makes,
                remixes: currentImport.remixes - previousImport.remixes,
                comments: currentImport.comments - previousImport.comments,
                collections: currentImport.collections - previousImport.collections
            }
        );
    }

    const insertRecalculatedDailyStatsResults = await statistics.insertRecalculatedDailyStats(dailyStats);
    if (insertRecalculatedDailyStatsResults.ok === false) {
        return insertRecalculatedDailyStatsResults;
    } 

    return { ok: true, data: dailyStats };
}

async function fixImportsTable(source) {
    // retrieve all imports for the named design/source
    const imports = await statistics.findAllImportsForADesignFromASource(source.source, source.design_id);
    if (!imports.ok) {
        return { ok: false, error: imports.error };
    }

    // get number of imports
    const maxImportsIndex = imports.data.length;

    // initialize group change
    let previousImport = imports.data[0];

    // iterate over imports (skip first one)
    for (let importIndex = 1; importIndex < maxImportsIndex; importIndex++) {
        // calculate date difference between current import_date and previous one
        const currentImport = imports.data[importIndex];
        const days = diffDays(previousImport.import_date, currentImport.import_date);

        // if the difference greater than one create missing records
        if (days > 1) {
            // calculate start, insert and end date
            const startDate = addDays(previousImport.import_date, 1);
            const endDate = currentImport.import_date;
            let insertDate = startDate;

            // create each missing record
            while (insertDate < endDate) {
                // create missing record based on the start record (aka previous record)
                let missingRecord = previousImport;
                missingRecord.import_date = insertDate;
                missingRecord.import_type = 'calculated';

                // increase insert date for potential next insert / group change
                insertDate = addDays(insertDate, 1);

                // insert missing record into the table
                const insertImportResult = await statistics.insertOneImport(missingRecord);
                if (insertImportResult.ok === false) {
                    return { ok: false, error: insertImportResult.error };
                }
            }
        }

        // copy current import into previous one
        previousImport = currentImport;
    }

    return { ok: true };
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function diffDays(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    const diffInDays = Math.round(Math.abs((d1 - d2) / oneDay));

    return diffInDays;
}

function showErrorSpinner(spinner, sourceIndex, maxSourceIndex, title, source, error) {
    spinner.fail(util.renderSpinnerPrefix(sourceIndex, maxSourceIndex, false) + title + " from " + source + "--> error: " + error);
}

module.exports = {
    getCommand
}
