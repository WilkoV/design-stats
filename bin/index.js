#!/usr/bin/env node

'use strict';

const { version } = require("../package.json");
const process = require("process");
const commander = require("commander");
const testCommand = require("../lib/commands/test-command");
const mergeSitesCommand = require("../lib/commands/merge-sites");

/**
 * Configure the run command
 */
async function run() {
    let program = new commander.Command();

    program
        .description("Collect statistical data from 3d printing sites")
        .name("ds")
        .showHelpAfterError(true)
        .version(version)
        .option("-h, --help", "show help")
        .addCommand(testCommand.getCommand())
        .addCommand(mergeSitesCommand.getCommand());

    program.parseAsync(process.argv);
}

// Run the command
run();
