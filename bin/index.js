#!/usr/bin/env node

'use strict';

const { version } = require("../package.json");
const process = require("process");
const commander = require("commander");
const testCommand = require("../lib/commands/test-command");
const mergeSitesCommand = require("../lib/commands/merge-sites-command");
const importDesignsCommand = require("../lib/commands/import-designs-command");
const updateStatisticsCommand = require("../lib/commands/update-statistics-command");
const showCommand = require("../lib/commands/show-command");
const recalculateStatisticsCommand = require("../lib/commands/recalculate-statistics-command")

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
        .addCommand(mergeSitesCommand.getCommand())
        .addCommand(importDesignsCommand.getCommand())
        .addCommand(updateStatisticsCommand.getCommand())
        .addCommand(recalculateStatisticsCommand.getCommand())
        .addCommand(showCommand.getCommand());

    program.parseAsync(process.argv);
}

// Run the command
run();
