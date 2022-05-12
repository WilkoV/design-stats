'use strict';

module.exports = Object.freeze({
    // test command choices
    CONNECTION_TYPE_THINGIVERSE_API: "thingiverse-api",
    CONNECTION_TYPE_CULTS: "cults3d",
    CONNECTION_TYPE_PRINTABLE: "printable",
    CONNECTION_TYPE_ALL: "all",

    // mandatory environment variables that have to be defined in the config file (.env)
    MANDATORY_ENV_VARS: [
        'DS_THINGIVERSE_API_TOKEN',
        'DS_THINGIVERSE_TEST_ID',
        'DS_CULTS_TEST_ID',
        'DS_CULTS_TIMEOUT',
        'DS_PRINTABLE_TEST_ID'
    ]
});
