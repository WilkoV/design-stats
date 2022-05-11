'use strict';

const fetch = require("node-fetch");
const process = require("process");

const BASE_URL = "https://api.thingiverse.com/";

/**
 * Get the design details for a design id
 * 
 * @param {*} id Thingiverse id of the design to get details for
 * @returns { ok, error, data }
 */
async function getDesignDetails(id) {
    // Key for the thingiverse API
    const API_KEY = process.env.DS_THINGIVERSE_API_TOKEN;

    try {
        // construct url
        const url = BASE_URL + "things/" + id + "?access_token=" + API_KEY;

        // fetch design details
        const response = await fetch(url);
        // check for response status
        if (!response.ok) {
            // request failed, return error
            return { ok: false, error: "Error: " + response.statusText + " (" + response.status + ")" };
        }

        // request succeeded, parse response
        const json = await response.json();

        // get relevant details from json
        const designDetails = {
            id: json.id,
            title: json.name,
            downloads: json.download_count || 0,
            likes: json.like_count || 0
        }

        // return success
        return { ok: true, data: designDetails };
    } catch (error) {
        // an error occurred, return error
        return { ok: false, error: error };
    }
}

module.exports = {
    getDesignDetails
};
