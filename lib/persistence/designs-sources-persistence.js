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
        let querySourceResult = await client.query(`SELECT design_id FROM sources WHERE design_id = $1 AND source = $2`, [designsId, source]);
        if (querySourceResult.rows.length > 0) {
            // design source exists, get id
            designsIdFromSource = querySourceResult.rows[0].design_id;
        } else {
            // design source does not exist, insert it
            let insertSourceResult = await client.query(`INSERT INTO sources (design_id, source, source_id, inactive) VALUES ($1, $2, $3, $4) RETURNING design_id`, [designsId, source, source_id, false]);
            // check if insert was successful
            if (insertSourceResult) {
                // get id of the inserted design source
                designsIdFromSource = insertSourceResult.rows[0].design_id;
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
 * @param {string} title title of the design
 * @param {string} source source (type) of the design. e.g. "Printable", "Cults3d", "Thingiverse"
 * @returns record from the query
 */
async function findOneSourceByTitleAndSourceType(title, source) {
    // get pool
    let pool = db.getPool();

    try {
        // execute the query
        let queryResult = await pool.query(`SELECT * FROM designs, sources WHERE designs.title = $1 AND sources.source = $2 AND designs.id = sources.design_id`, [title, source]);

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

/**
 * Retrieves all designs and their sources from the database.
 * 
 * @param {integer} designId database id of the design
 * @param {string} source source of the design (e.g. Thingiverse, Cults3d, Printable)
 * @returns {Promise<{ok: boolean, data: db rows, error: string}>} Ok is true and data contains the retrieved data from the DB. If an error occurred ok is false error has the error message and no data is returned
 */
async function findAllDesignSources(designId = "", source = "", title = "", limit = 0) {
    // get pool
    let pool = db.getPool();

    let filterById = designId == "" ? "" : ` AND design_id = ${designId} `;
    let filterBySource = source == "" ? "" : ` AND source = '${source}' `;
    let filterByTitle = title == "" ? "" : ` AND title ILIKE '%${title}%' `;
    let filterByLimit = limit == 0 ? "" : ` LIMIT ${limit} `;
    
    let sql = "SELECT d.id as design_id, d.title, s.source, s.source_id, s.inactive \
                FROM designs d, sources s \
                WHERE d.id = s.design_id " + filterById + filterBySource + filterByTitle + " \
                order by d.id, s.source" + filterByLimit;

    try {
        // select all designs and sources
        let queryResult = await pool.query(sql);

        // check if query found records
        if (queryResult.rows.length > 0) {
            return { ok: true, data: queryResult.rows };
        }

        return { ok: false, error: "No designs / sources found" };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

/**
 * Retrieves all designs from the database.
 * 
 * @returns {Promise<{ok: boolean, data: db rows, error: string}>} Ok is true and data contains the retrieved data from the DB. If an error occurred ok is false error has the error message and no data is returned
 */
async function findAllDesigns(designId = "", title = "", limit = 0) {
    // get pool
    let pool = db.getPool();

    try {
        let filterById = designId == "" ? "" : ` AND id = ${designId} `;
        let filterByTitle = title == "" ? "" : ` AND title ILIKE '%${title}%' `;
        let filterByLimit = limit == 0 ? "" : ` LIMIT ${limit} `;

        let sql = "SELECT id, title \
                    FROM designs \
                    WHERE 1 = 1 " + filterById + filterByTitle + " \
                    order by id" + filterByLimit;

        // select all designs
        let queryResult = await pool.query(sql);

        // return query result
        return { ok: true, data: queryResult.rows };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

/**
 * Retrieves all sources from the database.
 * 
 * @returns {Promise<{ok: boolean, data: db rows, error: string}>} Ok is true and data contains the retrieved data from the DB. If an error occurred ok is false error has the error message and no data is returned
 */
async function findAllSources() {
    // get pool
    let pool = db.getPool();

    try {
        // select all sources
        let queryResult = await pool.query(`SELECT design_id, source, source_id FROM sources`);

        return { ok: true, data: queryResult.rows };
    } catch (error) {
        // return db error
        return { ok: false, error: error };
    }
}

module.exports = {
    insertOneSource,
    findOneSourceByTitleAndSourceType,
    findAllDesignSources,
    findAllDesigns,
    findAllSources
}   
