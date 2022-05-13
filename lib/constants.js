'use strict';

module.exports = Object.freeze({
    // test command choices
    CONNECTION_TYPE_THINGIVERSE_API_DETAILS: "thingiverse-api-details",
    CONNECTION_TYPE_THINGIVERSE_API_LIST: "thingiverse-api-list",
    CONNECTION_TYPE_CULTS_DETAILS: "cults3d-details",
    CONNECTION_TYPE_CULTS_LIST: "cults3d-list",
    CONNECTION_TYPE_PRINTABLE_DETAILS: "printable-details",
    CONNECTION_TYPE_ALL: "all",

    // mandatory environment variables that have to be defined in the config file (.env)
    MANDATORY_ENV_VARS: [
        'DS_THINGIVERSE_API_TOKEN',
        'DS_THINGIVERSE_USERNAME',
        'DS_THINGIVERSE_TEST_ID',
        'DS_CULTS_USERNAME',
        'DS_CULTS_TEST_ID',
        'DS_CULTS_TIMEOUT',
        'DS_PRINTABLE_TEST_ID'
    ]
});
