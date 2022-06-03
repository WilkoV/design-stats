"use strict";

module.exports = Object.freeze({
    // test command choices
    CONNECTION_TYPE_THINGIVERSE_API_DETAILS: "thingiverse-api-details",
    CONNECTION_TYPE_THINGIVERSE_API_LIST: "thingiverse-api-list",
    CONNECTION_TYPE_CULTS_DETAILS: "cults3d-details",
    CONNECTION_TYPE_CULTS_LIST: "cults3d-list",
    CONNECTION_TYPE_PRINTABLE_DETAILS: "printables-details",
    CONNECTION_TYPE_PRINTABLE_LIST: "printables-list",
    CONNECTION_TYPE_DB: "db",
    CONNECTION_TYPE_ALL: "all",

    // source types in json files and in the database
    SOURCE_CULTS: "Cults3d",
    SOURCE_THINGIVERSE: "Thingiverse",
    SOURCE_PRINTABLE: "Printables",

    // import types
    IMPORT_TYPE_INITIAL: "initial",
    IMPORT_TYPE_REGULAR: "regular",
    IMPORT_TYPE_ADJUSTED_IMPORT_DATE: "adjusted date",

    // statistics types
    STATISTICS_TYPE_DOWNLOADS: "downloads",
    STATISTICS_TYPE_LIKES: "likes",
    STATISTICS_TYPE_VIEWS: "views",
    STATISTICS_TYPE_MAKES: "makes",
    STATISTICS_TYPE_REMIXES: "remixes",
    STATISTICS_TYPE_COMMENTS: "comments",
    STATISTICS_TYPE_COLLECTIONS: "collections",

    // processing status used by merge-sites and import-designs
    PROCESSING_STATUS_MERGED: "merged",
    PROCESSING_STATUS_NOT_MERGED: "not merged",
    PROCESSING_STATUS_UNPROCESSED: "unprocessed",
    PROCESSING_STATUS_RETRY: "retry",
    PROCESSING_STATUS_IMPORTED: "imported",
    PROCESSING_STATUS_FAILED_NO_SOURCES: "FAILED: no sources",
    PROCESSING_STATUS_FAILED_UNKNOWN_SOURCE: "FAILED: unknown source",
    PROCESSING_STATUS_FAILED_TITLE_MISMATCH: "FAILED: title mismatch",
    PROCESSING_STATUS_NOT_FOUND: "FAILED: not found, no or unparsable response",
    PROCESSING_STATUS_DB_ERROR: "FAILED: database error",

    // mandatory environment variables that have to be defined in the config file (.env)
    MANDATORY_ENV_VARS: [
        "DS_THINGIVERSE_API_TOKEN",
        "DS_THINGIVERSE_USERNAME",
        "DS_THINGIVERSE_TEST_ID",
        "DS_CULTS_USERNAME",
        "DS_CULTS_TEST_ID",
        "DS_CULTS_TIMEOUT",
        "DS_PRINTABLE_TEST_ID",
        "DS_PRINTABLE_USER_ID",
        "DS_POSTGRES_HOST",
        "DS_POSTGRES_PORT",
        "DS_POSTGRES_USER",
        "DS_POSTGRES_PASSWORD",
        "DS_POSTGRES_DB",
        "DS_POSTGRES_DB_CONNECTION_TIMEOUT",
        "DS_POSTGRES_DB_IDLE_TIMEOUT",
        "DS_POSTGRES_DB_MIN_CONNECTIONS",
        "DS_POSTGRES_DB_MAX_CONNECTIONS",
        "DS_POSTGRES_DB_SCHEMA_VERSION",
    ]
});
