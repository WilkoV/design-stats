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

module.exports = {
    getPool,
    endPool
}
