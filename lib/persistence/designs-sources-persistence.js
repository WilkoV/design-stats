const db = require("./db");

/**
 * Inserts a new design source into the database.
 * 
 * @param {*} title title of the design
 * @param {*} source source (type) of the design
 * @param {*} source_id external id of the source
 * @returns id of the inserted design source
 */
async function insertOneSource(title, source, source_id) {
    // get pool
    let pool = db.getPool();

    // client is used because severals inserts are done in the same transaction
    const client = await pool.connect();

    // initialize ids
    let designsId = null;
    let designsIdFromSource = null;

    // begin transaction
    try {
        // begin transaction
        await client.query('BEGIN');

        // check if design exists
        let queryDesignResult = await client.query(`SELECT id FROM designs WHERE title = $1`, [title]);
        if (queryDesignResult.rows.length > 0) {
            // design exists, get id
            designsId = queryDesignResult.rows[0].id;
        } else {
            // design does not exist, insert it
            let insertDesignResult = await client.query(`INSERT INTO designs (title) VALUES ($1) RETURNING id`, [title]);
            // check if insert was successful
            if (insertDesignResult) {
                // get id of the inserted design
                designsId = insertDesignResult.rows[0].id;
            } else {
                // insert failed
                return { ok: false, error: "Insert design failed" };
            }
        }

        // check if design source exists
        let querySourceResult = await client.query(`SELECT designs_id FROM sources WHERE designs_id = $1 AND source = $2`, [designsId, source]);
        if (querySourceResult.rows.length > 0) {
            // design source exists, get id
            designsIdFromSource = querySourceResult.rows[0].designs_id;
        } else {
            // design source does not exist, insert it
            let insertSourceResult = await client.query(`INSERT INTO sources (designs_id, source, source_id) VALUES ($1, $2, $3) RETURNING designs_id`, [designsId, source, source_id]);
            // check if insert was successful
            if (insertSourceResult) {
                // get id of the inserted design source
                designsIdFromSource = insertSourceResult.rows[0].designs_id;
            } else {
                // insert failed
                return { ok: false, error: "Insert design source failed" };
            }
        }

        // commit transaction
        await client.query('COMMIT')

        // return id of the inserted design source
        return { ok: true, data: designsIdFromSource };
    } catch (error) {
        // rollback transaction
        await client.query('ROLLBACK')
        return { ok: false, error: error };
    } finally {
        // release client
        client.release();
    }
}

/**
 * Find one source by design's title and source's source type.
 * @param {strng} title title of the design
 * @param {strng} source source (type) of the design. e.g. "Printable", "Cults3d", "Thingiverse"
 * @returns record from the query
 */
async function findOneSourceByTitleAndSourceType(title, source) {
    // get pool
    let pool = db.getPool();

    try {
        // execute the query
        let queryResult = await pool.query(`SELECT * FROM designs, sources WHERE designs.title = $1 AND sources.source = $2 AND designs.id = sources.designs_id`, [title, source]);

        // return record if one record was found
        if (queryResult.rows.length == 1) {
            return { ok: true, data: queryResult.rows[0] };
        } 
        
        // return error if multiple records were found
        if (queryResult.rows.length > 1) {
            return { ok: false, error: "Multiple records found" };
        }

        // return error if no record was found
        return { ok: false, error: "Design source not found" };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    } 
}

module.exports = {
    insertOneSource,
    findOneSourceByTitleAndSourceType
}