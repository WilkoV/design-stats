const { Pool } = require('pg');
const process = require("process");

// global pool
let pool = null;

/**
 * 
 * @returns instance of pool
 */
function getPool() {
    // if pool is initialized, return it
    if (pool) {
        return pool;
    }

    // if pool is not initialized, create it
    pool = new Pool({
        user: process.env.DS_POSTGRES_USER,
        password: process.env.DS_POSTGRES_PASSWORD,
        host: process.env.DS_POSTGRES_HOST,
        port: process.env.DS_POSTGRES_PORT,
        database: process.env.DS_POSTGRES_DB,
        connectionTimeoutMillis: process.env.DS_POSTGRES_DB_CONNECTION_TIMEOUT,
        idleTimeoutMillis: process.env.DS_POSTGRES_DB_IDLE_TIMEOUT,
        min: process.env.DS_POSTGRES_DB_MIN_CONNECTIONS,
        max: process.env.DS_POSTGRES_DB_MAX_CONNECTIONS,
    });

    // return new pool
    return pool;
}

/**
 * End global pool
 */
async function endPool() {
    // if pool is initialized, end it
    if (pool) {
        await pool.end();
        pool = null;
    }
}

/**
 * Test the connection to the database by performing a "SELECT now()" query
 * 
 * @returns {Promise<{ok: boolean, error: string, data: timestamp}>}
 */
async function testConnection() {
    // get pool
    let pool = getPool();

    // test connection
    try {
        // execute query
        let queryResult = await pool.query("SELECT NOW()");
        // check if one row was returned
        if (queryResult.rows.length == 1) {
            // return the result row if successful
            return { ok: true, data: queryResult.rows[0] };
        }
        // return error if no rows were returned
        return { ok: false, error: "No records found" };
    } catch (error) {
        // return error if an error occurred
        return { ok: false, error: error };
    }
}

/**
 * Check if the database schema version equals the expected version
 * 
 * @returns {Promise<{ok: boolean, error: string, data: integer}>}
 */
async function checkSchemaVersion() {
    // get pool
    let pool = getPool();

    // find schema version
    try {
        // execute query
        let queryResult = await pool.query("SELECT value FROM versions");
        
        // check if one row was returned
        
        if (queryResult.rows.length > 1) {
            // return error if more than one row was returned
            return { ok: false, error: "Multiple records found" };
        }

        if (queryResult.rows.length < 1) {
            // return error if no rows were returned
            return { ok: false, error: "No records found" };
        }

        // one row was returned. check if it is the expected version

        if (queryResult.rows[0].value != process.env.DS_POSTGRES_DB_SCHEMA_VERSION) {
            // return error if the version is not the expected version
            return { ok: false, error: "Schema version mismatch. Found: " + queryResult.rows[0].value + " Expected: " + process.env.DS_POSTGRES_DB_SCHEMA_VERSION };
        }

        // return the version if successful
        return { ok: true, data: queryResult.rows[0] };
    } catch (error) {
        // return error if an error occurred
        return { ok: false, error: error };
    }
}

module.exports = {
    getPool,
    endPool,
    testConnection,
    checkSchemaVersion
};
