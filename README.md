# design-stats

Collects statistical data from 3d printing sites like Thingiverse, Cults3d or Printable

- [design-stats](#design-stats)
  - [Installation](#installation)
    - [Requirements](#requirements)
    - [Clone from git](#clone-from-git)
    - [Create configuration file](#create-configuration-file)
    - [Install design-stats (ds)](#install-design-stats-ds)
  - [Usage](#usage)
  - [ds help](#ds-help)
    - [List all commands](#list-all-commands)
    - [Get help for a specific command](#get-help-for-a-specific-command)
    - [ds test command](#ds-test-command)

## Installation

### Requirements

- [nodejs](https://nodejs.org/en/)
- [Thingiverse API key](https://www.thingiverse.com/developers/apps)

### Clone from git

```bash
# clone the repository
$ git clone https://github.com/WilkoV/design-stats.git
$ cd design-stats
```

### Create configuration file

Create the directory `config` in the projects root and create a file `.env` with the following content:

```properties
#
# Thingiverse API configuration
#

# Thingiverse API key
DS_THINGIVERSE_API_TOKEN=<your-thingiverse-API-key>
# Design on Thingiverse that could be used by the test command
DS_THINGIVERSE_TEST_ID=5249332

#
# Cults3d configuration
#

# Timeout for fetching details from Cults 3d web site
DS_CULTS_TIMEOUT=10000
# Design on Cults 3d that could be used by the test command
DS_CUTLS_TEST_ID=carafe-01
```

### Install design-stats (ds)

```bash
# Install nodejs dependencies
$ npm install

# Install command globally 
$ npm install -g
```

The command `ds` or `design-stats` is now available. The configuration can be tested with the command `ds test`.

```bash
# Test connections to the database and to the 3d printing sites used by design-stats
$ ds test
```

## Usage

After installation the command can be accessed by `design-stats` or `ds`. This document will use `ds`.

## ds help

### List all commands

```bash
# Show help and list of all commands
$ ds --help
# output:
Usage: ds [options] [command]

Collects statistical data from 3d printing sites

Options:
  -V, --version                    output the version number
  -h, --help                       show help

Commands:
  test [options] [connectionType]  Test connections to the database and 3d printing sites
  help [command]                   display help for command

```

### Get help for a specific command

`ds help [command]` shows the help of a specific command.

```bash
# Show help message for the test command
$ ds help test
# output
Usage: ds test [options] [connectionType]

Test connections to the database and 3d printing sites

Arguments:
  connectionType             Type of connection to test (choices: "thingiverse-api", "cults3d", "all", default: "all")

Options:
  -c, --config <configFile>  config file path (default: "config/.env"
```

### ds test command

`ds test` tests the connections to the database and the 3d printing sites used by design-stats. It can be used to test the configuration file or to quickly verify that the basic api and web scraping functions are working.

```bash
# test all connections
$ ds test
# output:
✔ Configuration loaded
✔ Thingiverse test connection successful: {"id":5249332,"title":"Banana 01","downloads":123,"likes":13}
```

To test a specific connection use `ds test [connectionType]`. Valid connection types are:

- `thingiverse-api`: test the connection to the Thingiverse API
- `all`: test all connections

```bash
# test all connections
$ ds test thingiverse-api
# output:
✔ Configuration loaded
✔ Thingiverse test connection successful: {"id":5249332,"title":"Banana 01","downloads":123,"likes":13}
```
