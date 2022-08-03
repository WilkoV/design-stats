const db = require("./db");

/**
 * Insert data into the statistics tables
 * 
 * @param {ImportData} importData data to be inserted into imports and daily_statistics tables
 * @param {*} statistics list of statistics to applied to the statistics table
 * @returns {Promise<{ok: boolean, error: string}>} Ok is true if the inserts was successful. ok is false and error has the error message
 */
async function insertOneStatistic(importData, statistics) {
    // get pool
    const pool = db.getPool();
    // get client
    const client = await pool.connect();

    try {
        // begin transaction
        await client.query("BEGIN");

        // statement that upsert a single import
        const insertImportsSql =
            `INSERT INTO imports
             (import_date, design_id, source, import_type, downloads, likes, views, makes, remixes, comments, collections) 
             VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (import_date, design_id, source) DO UPDATE 
             SET import_type = $4, downloads = $5, likes = $6, views = $7, makes = $8, remixes = $9, comments = $10, collections = $11`;

        // execute upsert into imports
        const insertImportsResult = await client.query(insertImportsSql, [
            importData.importDate, importData.designId, importData.source, importData.importType,
            importData.totalDataPoints.downloads, importData.totalDataPoints.likes, importData.totalDataPoints.views, importData.totalDataPoints.makes, importData.totalDataPoints.remixes, importData.totalDataPoints.comments, importData.totalDataPoints.collections
        ]);

        // check if no rows were affected and if so, return rollback and error
        if (insertImportsResult.rowCount === 0) {
            // rollback
            await client.query('ROLLBACK');
            return { ok: false, error: "Insert into imports failed" };
        }

        // statement that upsert a single daily_statistics
        const insertDailyStatisticsSql =
            `INSERT INTO daily_statistics 
             (import_date, design_id, source, import_type, downloads, likes, views, makes, remixes, comments, collections) 
             VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (import_date, design_id, source) DO UPDATE 
             SET import_type = $4, downloads = $5, likes = $6, views = $7, makes = $8, remixes = $9, comments = $10, collections = $11`;

        // execute upsert into daily_statistics
        const insertDailyStatisticsResult = await client.query(insertDailyStatisticsSql, [
            importData.importDate, importData.designId, importData.source, importData.importType,
            importData.dailyDataPoints.downloads, importData.dailyDataPoints.likes, importData.dailyDataPoints.views, importData.dailyDataPoints.makes, importData.dailyDataPoints.remixes, importData.dailyDataPoints.comments, importData.dailyDataPoints.collections
        ]);

        // check if no rows were affected and if so, return rollback and error
        if (insertDailyStatisticsResult.rowCount === 0) {
            // rollback
            await client.query('ROLLBACK');
            return { ok: false, error: "insert daily failed" };
        }

        // get year and month from import date for insert into statistics
        const year = importData.importDate.getFullYear();
        const month = importData.importDate.getMonth() + 1;

        // statement that upsert a single statistic
        const insertStatisticsSql =
            `INSERT INTO statistics
             (year, month, design_id, source, statistic_type, last_1d, last_7d, last_30d, this_month, last_365d, this_year, total)
             VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (year, month, design_id, source, statistic_type) DO UPDATE
             SET last_1d = $6, last_7d = $7, last_30d = $8, this_month = $9, last_365d = $10, this_year = $11, total = $12`

        // iterate over all statistic types
        for (let [statisticType, statistic] of statistics.entries()) {
            // upsert into statistics
            const insertStatisticsResult = await client.query(insertStatisticsSql, [
                year, month, importData.designId, importData.source, statisticType,
                statistic.last1Days, statistic.last7Days, statistic.last30Days, statistic.thisMonth, statistic.last365Days, statistic.thisYear, statistic.total]);

            // check if no rows were affected and if so, return rollback and error
            if (insertStatisticsResult.rowCount === 0) {
                // rollback
                await client.query('ROLLBACK');
                return { ok: false, error: "insert statistics failed" };
            }
        }

        // commit transaction and return success
        await client.query("COMMIT");
        return { ok: true };
    } catch (error) {
        // rollback transaction and return error
        await client.query('ROLLBACK');
        return { ok: false, error: error };
    } finally {
        // release client
        client.release();
    }
}

/**
 * Check if the design for the specified source has already data in the import table before the import date
 * 
 * @param {date} import_date date of the import
 * @param {integer} design_id database id of the design
 * @param {string} source source of the import (e.g. "Thingiverse", "Cults3d", "Printables")
 * @returns {Promise<{ok: boolean, data: boolean, error: string}>} Ok is true if no error occurred. If a entry exists than data is true otherwise data is false. If ok is false error has the error message and no data is returned
 */
async function hasImports(import_date, design_id, source) {
    // get pool
    const pool = db.getPool();

    try {
        // select all imports for a design and source before import_date
        const queryResult = await pool.query("SELECT import_date FROM imports WHERE design_id = $1 AND source = $2 AND import_date < $3", [design_id, source, import_date]);

        // check if import exists

        if (queryResult.rowCount === 0) {
            // no rows returned so return false
            return { ok: true, data: false };
        }

        // return true
        return { ok: true, data: true };
    } catch (error) {
        // an error occurred. return error
        return { ok: false, error: error };
    }
}

/**
 * Get the next most recent record for the import date and the specified design and source
 * 
 * @param {date} import_date date of the import
 * @param {integer} design_id database id of the design
 * @param {string} source source of the import (e.g. "Thingiverse", "Cults3d", "Printables")
 * @returns {Promise<{ok: boolean, data: db record, error: string}>} Ok is true and data contains the next most recent entry from the DB. If no record could be found or an error occurred ok is false error has the error message and no data is returned
 */
async function findPreviousImport(import_date, design_id, source) {
    // get pool
    const pool = db.getPool();

    // select one import for a design and source before import_date
    const sql = `SELECT import_date, design_id, source, downloads, likes, views, makes, remixes, comments, collections
                 FROM imports 
                 WHERE import_date < $1  
                 AND design_id = $2  
                 AND source = $3  
                 ORDER BY import_date DESC LIMIT 1`;
    try {
        // perform query
        const queryResult = await pool.query(sql, [import_date, design_id, source]);

        // check if no rows were returned
        if (queryResult.rowCount === 0) {
            // no rows returned so return error
            return { ok: false, error: "No previous import found" };
        }

        // return the first row
        return { ok: true, data: queryResult.rows[0] };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

/**
 * Calculate sums for all the data points for the specified import date and design and period
 * 
 * @param {date} import_date date of the import
 * @param {integer} design_id database id of the design
 * @param {string} source source of the import (e.g. "Thingiverse", "Cults3d", "Printables")
 * @param {integer} period period for the statistic (e.g. 1, 7, 30, 365)
 * @param {*} dailyDataPoints 
 * @returns {Promise<{ok: boolean, data: {downloads, likes, views, makes, remixes, comments, collections}, error: string}>} Ok is true and data contains the calculated data from the DB. If no data was found or an error occurred ok is false error has the error message and no data is returned
 */
async function findDailyStatisticsSumsForPeriod(import_date, design_id, source, period, dailyDataPoints) {
    // get pool
    const pool = db.getPool();

    // check if number of days is an edge case
    if (period === 1) {
        // no need to perform a query if dailyDataPoints contains all data{
        let result = {
            downloads: dailyDataPoints.downloads,
            likes: dailyDataPoints.likes,
            views: dailyDataPoints.views,
            makes: dailyDataPoints.makes,
            remixes: dailyDataPoints.remixes,
            comments: dailyDataPoints.comments,
            collections: dailyDataPoints.collections
        }

        return { ok: true, data: result };
    }

    // calculate sums for the current period
    const sql =
        "SELECT sum(downloads) AS downloads, sum(likes) AS likes, sum(views) as views, sum(makes) as makes, \
         sum(remixes) as remixes, sum(comments) as comments, sum(collections) as collections \
         FROM daily_statistics \
         WHERE import_date > CAST($1 AS DATE) - INTERVAL '" + period + " DAYS' \
         AND import_date <$1 \
         AND design_id = $2 \
         AND source = $3";

    try {
        // perform query
        let queryResult = await pool.query(sql, [import_date, design_id, source]);

        // check if no rows were returned
        if (queryResult.rowCount === 0) {
            return { ok: false, error: "No daily_statistics sums found for period " + period };
        }

        // return the first row
        let result = {
            downloads: parseInt(queryResult.rows[0].downloads) + dailyDataPoints.downloads,
            likes: parseInt(queryResult.rows[0].likes) + dailyDataPoints.likes,
            views: parseInt(queryResult.rows[0].views) + dailyDataPoints.views,
            makes: parseInt(queryResult.rows[0].makes) + dailyDataPoints.makes,
            remixes: parseInt(queryResult.rows[0].remixes) + dailyDataPoints.remixes,
            comments: parseInt(queryResult.rows[0].comments) + dailyDataPoints.comments,
            collections: parseInt(queryResult.rows[0].collections) + dailyDataPoints.collections
        }

        // return the result
        return { ok: true, data: result };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

/**
 * Get all imports from the db
 * 
 * @returns {Promise<{ok: boolean, data: db rows, error: string}>} Ok is true and data contains the retrieved data from the DB. If an error occurred ok is false error has the error message and no data is returned
 */
async function findAllImports() {
    // get pool
    const pool = db.getPool();

    try {
        // select all imports
        const queryResult = await pool.query('SELECT import_date, design_id, source, downloads, likes FROM imports');

        return { ok: true, data: queryResult.rows };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

/**
 * Get all daily statistics from the db
 * 
 * @returns {Promise<{ok: boolean, data: db rows, error: string}>} Ok is true and data contains the retrieved data from the DB. If an error occurred ok is false error has the error message and no data is returned
 */
async function findAllDailyStatistics() {
    // get pool
    const pool = db.getPool();

    try {
        // select all daily_statistics
        const queryResult = await pool.query('SELECT import_date, design_id, source, downloads, likes FROM daily_statistics');

        return { ok: true, data: queryResult.rows };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

/**
 * Retrieve all statistics from the db
 * 
 * @returns {Promise<{ok: boolean, data: db rows, error: string}>} Ok is true and data contains the retrieved data from the DB. If an error occurred ok is false error has the error message and no data is returned
 */
async function findAllStatistics() {
    // get pool
    const pool = db.getPool();

    try {
        // select all statistics
        const queryResult = await pool.query('SELECT year, month, design_id, source, last_1d, last_7d, last_30d, this_month, last_365d, this_year, total FROM statistics');

        return { ok: true, data: queryResult.rows };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

async function findDeltaSums(period, showZeroRows, source = "", date = "", limit = 0) {
    const periods = ["daily", "monthly", "yearly", "total"];

    if (!periods.includes(period)) {
        return { ok: false, error: "Invalid period" };
    }

    date = getPeriodFromDate(date, period);

    // get pool
    const pool = db.getPool();

    const filterZeroRows = showZeroRows ? " " : " AND (downloads > 0 OR likes > 0 OR views > 0 OR makes > 0 OR remixes > 0 OR comments > 0 OR collections > 0) ";
    const filterBySource = source == "" ? "" : ` AND source = '${source}' `;
    const filterByDate = date == "" ? "" : ` AND import_date = '${date}' `;
    const filterByLimit = limit == 0 ? "" : ` LIMIT ${limit} `;

    const sql = "SELECT * \
                 FROM " + period + "_statistics_sums \
                 WHERE 1 = 1 " + filterZeroRows + filterBySource + filterByDate + " \
                 ORDER BY import_date" + filterByLimit;

    try {
        // select all sources
        let queryResult = await pool.query(sql);

        // return error if no records were found
        if (queryResult.rows.length == 0) {
            return { ok: false, error: "No daily sums found" };
        }

        return { ok: true, data: queryResult.rows };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

async function findTotals(showZeroRows, source = "", limit = 0) {
    // get pool
    let pool = db.getPool();

    const filterZeroRows = showZeroRows ? " " : " AND (downloads > 0 OR likes > 0 OR views > 0 OR makes > 0 OR remixes > 0 OR comments > 0 OR collections > 0) ";
    const filterBySource = source == "" ? "" : ` AND source = '${source}' `;
    const filterByLimit = limit == 0 ? "" : ` LIMIT ${limit} `;

    const sql = "SELECT * \
                 FROM total_statistics_sums \
                 WHERE 1 = 1 " + filterZeroRows + filterBySource + filterByLimit;

    try {
        // select all sources
        const queryResult = await pool.query(sql);

        // return error if no records were found
        if (queryResult.rows.length == 0) {
            return { ok: false, error: "No daily sums found" };
        }

        return { ok: true, data: queryResult.rows };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

async function findDesignDeltaSums(period, showZeroRows, designId = "", title = "", source = "", date = "", limit = 0) {
    const periods = ["daily", "monthly", "yearly"];

    if (!periods.includes(period)) {
        return { ok: false, error: "Invalid period" };
    }

    date = getPeriodFromDate(date, period);

    // get pool
    let pool = db.getPool();

    const filterZeroRows = showZeroRows ? " " : " AND (downloads > 0 OR likes > 0 OR views > 0 OR makes > 0 OR remixes > 0 OR comments > 0 OR collections > 0) ";
    const filterByDesignId = designId == "" ? "" : ` AND design_id = ${designId} `;
    const filterBySource = source == "" ? "" : ` AND source = '${source}' `;
    const filterByDate = date == "" ? "" : ` AND import_date = '${date}' `;
    const filterByLimit = limit == 0 ? "" : ` LIMIT ${limit} `;
    const filterByTitle = title == "" ? "" : ` AND title ILIKE '%${title}%' `;

    const sql = "SELECT * \
                 FROM " + period + "_design_statistics_sums \
                 WHERE 1 = 1" +
        filterZeroRows +
        filterByDesignId +
        filterByTitle +
        filterBySource +
        filterByDate + " \
                 ORDER BY import_date, design_id" + filterByLimit;

    try {
        // select all sources
        const queryResult = await pool.query(sql);

        // return error if no records were found
        if (queryResult.rows.length == 0) {
            return { ok: false, error: "No daily sums found" };
        }

        return { ok: true, data: queryResult.rows };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

async function findDesignTotals(showZeroRows, designId = "", title = "", source = "", limit = 0) {
    // get pool
    const pool = db.getPool();

    const filterZeroRows = showZeroRows ? " " : " AND (downloads > 0 OR likes > 0 OR views > 0 OR makes > 0 OR remixes > 0 OR comments > 0 OR collections > 0) ";
    const filterByDesignId = designId == "" ? "" : ` AND design_id = ${designId} `;
    const filterBySource = source == "" ? "" : ` AND source = '${source}' `;
    const filterByLimit = limit == 0 ? "" : ` LIMIT ${limit} `;
    const filterByTitle = title == "" ? "" : ` AND title ILIKE '%${title}%' `;


    const sql = "SELECT * \
                 FROM total_design_statistics_sums \
                 WHERE 1 = 1" +
        filterZeroRows +
        filterByDesignId +
        filterByTitle +
        filterBySource + " \
                 ORDER BY import_date, design_id" + filterByLimit;


    try {
        // select all sources
        const queryResult = await pool.query(sql);

        // return error if no records were found
        if (queryResult.rows.length == 0) {
            return { ok: false, error: "No daily sums found" };
        }

        return { ok: true, data: queryResult.rows };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

async function findCompareDesignDownloads(period, showZeroRows, designId = "", title = "", date = "", limit = 0) {
    const periods = ["daily", "monthly", "yearly", "total"];

    if (!periods.includes(period)) {
        return { ok: false, error: "Invalid period" };
    }

    date = getPeriodFromDate(date, period);

    // get pool
    let pool = db.getPool();

    const filterZeroRows = showZeroRows ? " " : " AND (thingiverse_downloads > 0 OR cults3d_downloads > 0 OR printables_downloads > 0) ";
    const filterByDesignId = designId == "" ? "" : ` AND design_id = ${designId} `;
    const filterByDate = date == "" ? "" : ` AND import_date = '${date}' `;
    const filterByLimit = limit == 0 ? "" : ` LIMIT ${limit} `;
    const filterByTitle = title == "" ? "" : ` AND title ILIKE '%${title}%' `;


    const sql = "SELECT * \
                 FROM compare_" + period + "_design_downloads \
                 WHERE 1 = 1" +
        filterZeroRows +
        filterByDesignId +
        filterByTitle +
        filterByDate + " \
                 ORDER BY import_date, design_id" + filterByLimit;

    try {
        // select all sources
        const queryResult = await pool.query(sql);

        // return error if no records were found
        if (queryResult.rows.length == 0) {
            return { ok: false, error: "No daily sums found" };
        }

        return { ok: true, data: queryResult.rows };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

async function findCompareDesignDownloadsTotals(showZeroRows, designId = "", title = "", limit = 0) {
    // get pool
    let pool = db.getPool();

    const filterZeroRows = showZeroRows ? " " : " AND (thingiverse_downloads > 0 OR cults3d_downloads > 0 OR printables_downloads > 0) ";
    const filterByDesignId = designId == "" ? "" : ` AND design_id = ${designId} `;
    const filterByLimit = limit == 0 ? "" : ` LIMIT ${limit} `;
    const filterByTitle = title == "" ? "" : ` AND title ILIKE '%${title}%' `;

    const sql = "SELECT * \
                 FROM compare_total_design_downloads \
                 WHERE 1 = 1" +
        filterZeroRows +
        filterByDesignId +
        filterByTitle + " \
                 ORDER BY design_id" + filterByLimit;

    try {
        // select all sources
        const queryResult = await pool.query(sql);

        // return error if no records were found
        if (queryResult.rows.length == 0) {
            return { ok: false, error: "No daily sums found" };
        }

        return { ok: true, data: queryResult.rows };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

async function findDesignStatistics(showZeroRows, designId = "", title = "", source = "", statisticType = "", date = "", limit = 0) {
    // get pool
    let pool = db.getPool();

    const filterZeroRows = showZeroRows ? " " : " AND ( last_1d > 0 OR last_7d > 0 OR last_30d > 0 OR this_month > 0 OR last_365d > 0 OR this_year > 0 OR total > 0 ) ";
    const filterByDesignId = designId == "" ? "" : ` AND design_id = ${designId} `;
    const filterByLimit = limit == 0 ? "" : ` LIMIT ${limit} `;
    const filterByTitle = title == "" ? "" : ` AND title ILIKE '%${title}%' `;
    const filterBySource = source == "" ? "" : ` AND source = '${source}' `;
    const filterByDate = date == "" ? "" : ` AND import_date = '${date}' `;
    const filterByStatisticsType = statisticType == "" ? "" : ` AND statistic_type = '${statisticType}' `;

    const sql = "SELECT * \
                 FROM design_statistics \
                 WHERE 1 = 1 " + filterZeroRows + filterByDesignId + filterByTitle + filterBySource + filterByDate + filterByStatisticsType + " \
                 ORDER BY year, month, design_id, source, statistic_type" + filterByLimit;

    try {
        // select all sources
        const queryResult = await pool.query(sql);

        // return error if no records were found
        if (queryResult.rows.length == 0) {
            return { ok: false, error: "No daily sums found" };
        }

        return { ok: true, data: queryResult.rows };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

async function findSourceStatistics(showZeroRows, source = "", statisticType = "", date = "", limit = 0) {
    // get pool
    let pool = db.getPool();

    const filterZeroRows = showZeroRows ? " " : " AND ( last_1d > 0 OR last_7d > 0 OR last_30d > 0 OR this_month > 0 OR last_365d > 0 OR this_year > 0 OR total > 0 ) ";
    const filterByLimit = limit == 0 ? "" : ` LIMIT ${limit} `;
    const filterBySource = source == "" ? "" : ` AND source = '${source}' `;
    const filterByDate = date == "" ? "" : ` AND import_date = '${date}' `;
    const filterByStatisticsType = statisticType == "" ? "" : ` AND statistic_type = '${statisticType}' `;

    const sql = "SELECT * \
                 FROM source_statistics \
                 WHERE 1 = 1 " + filterZeroRows + filterBySource + filterByDate + filterByStatisticsType + " \
                 ORDER BY year, month, source, statistic_type" + filterByLimit;

    try {
        // select all sources
        const queryResult = await pool.query(sql);

        // return error if no records were found
        if (queryResult.rows.length == 0) {
            return { ok: false, error: "No daily sums found" };
        }

        return { ok: true, data: queryResult.rows };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

function getPeriodFromDate(date, period) {
    if (period == "daily") {
        return date;
    }

    if (period == "monthly") {
        return date.substring(0, 7);
    }

    if (period == "yearly") {
        return date.substring(0, 4);
    }

    return "";
}

class StatisticData {
    constructor(statisticType, last1Days = 0, last7Days = 0, last30Days = 0, thisMonth = 0, last365Days = 0, thisYear = 0, total = 0) {
        this.statisticType = statisticType;
        this.last1Days = last1Days;
        this.last7Days = last7Days;
        this.last30Days = last30Days;
        this.thisMonth = thisMonth;
        this.last365Days = last365Days;
        this.thisYear = thisYear;
        this.total = total;
    }
}

class ImportData {
    constructor(importDate, designId, source, importType, totalDataPoints = new DataPoints(), dailyDataPoints = new DataPoints()) {
        this.importDate = importDate;
        this.designId = designId;
        this.source = source;
        this.importType = importType;
        this.totalDataPoints = totalDataPoints;
        this.dailyDataPoints = dailyDataPoints;
    }
}

class DataPoints {
    constructor(downloads = 0, likes = 0, views = 0, makes = 0, remixes = 0, comments = 0, collections = 0) {
        this.downloads = downloads;
        this.likes = likes;
        this.views = views;
        this.makes = makes;
        this.remixes = remixes;
        this.comments = comments;
        this.collections = collections;
    }
}

module.exports = {
    insertOneStatistic,
    hasImports,
    findDailyStatisticsSumsForPeriod,
    findAllImports,
    findAllDailyStatistics,
    findAllStatistics,
    findPreviousImport,
    findDeltaSums,
    findTotals,
    findDesignDeltaSums,
    findDesignTotals,
    findCompareDesignDownloads,
    findCompareDesignDownloadsTotals,
    findDesignStatistics,
    findSourceStatistics,
    StatisticData,
    ImportData,
    DataPoints
};
