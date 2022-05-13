'use strict';

const fetch = require("node-fetch");
const process = require("process");

const BASE_URL = "https://api.thingiverse.com/";

/**
 * Get the list of the user's designs
 *  
 * @returns Promise<{ ok: boolean, error: any, data {title: string, id: number} }>
 */
async function getDesigns() {
    // Get configuration from environment variables
    const API_KEY = process.env.DS_THINGIVERSE_API_TOKEN;
    const USERNAME = process.env.DS_THINGIVERSE_USERNAME;

    // list of designs
    let designs = [];
    // initialize page counter
    let pageNumber = 1;
    // initialize page array
    let data = [];

    do {
        try {
            // construct url
            const url = BASE_URL + "users/" + USERNAME + "/things?access_token=" + API_KEY + "&page=" + pageNumber;

            // fetch design list
            const response = await fetch(url);
            if (!response.ok) {
                // request failed, return error
                return { ok: false, error: "Error: " + response.statusText + " (" + response.status + ")" };
            }

            // request succeeded, parse response
            data = await response.json();

            // add designs to list
            for (let i = 0; i < data.length; i++) {
                designs.push({ title: data[i].name.trim(), source_id: data[i].id });
            }

            // increment page counter
            pageNumber++;
        } catch (error) {
            // an error occurred, return error
            return { ok: false, error: error };
        }
        // repeat until no more pages are available
    } while (data.length > 0);

    // return success with list of designs
    return { ok: true, data: designs };
}

/**
 * Get the design details for a design id
 * 
 * @param {*} id Thingiverse id of the design to get details for
 * @returns Promise<{ ok: boolean, error: any, data {id: string, title: string, downloads: number, likes: number} }>
 */
async function getDesign(id) {
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
    getDesigns,
    getDesign
};
