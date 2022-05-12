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
# Thingiverse user name
DS_THINGIVERSE_USERNAME=<your-thingiverse-user-name>
# Design on Thingiverse that could be used by the test command
DS_THINGIVERSE_TEST_ID=<your-thingiverse-design-id>

#
# Cults3d configuration
#

# Timeout for fetching details from Cults 3d web site
DS_CULTS_TIMEOUT=10000
# Design on Cults 3d that could be used by the test command
DS_CULTS_TEST_ID=<your-cults3d-design-id>

#
# Printable configuration
#

# Design on Printable that could be used by the test command
DS_PRINTABLE_TEST_ID=<your-printable-design-id>
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
# output:
✔ Configuration loaded
✔ Thingiverse test connection for details successful: {"id":5249332,"title":"Banana 01","downloads":124,"likes":13}
✔ Thingiverse test connection for lists successful: Found 165 designs
✔ Cults3d test connection for details successful: {"id":"carafe-01","title":"Carafe 01","downloads":"14","likes":"4"}
✔ Printable test connection for details successful: {"id":"135167-banana-01","title":"Banana 01","downloads":"21","likes":"4"}
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
  connectionType             Type of connection to test (choices: "thingiverse-api-details", "thingiverse-api-list", "cults3d-details", "printable-details", "all", default: "all")

Options:
  -c, --config <configFile>  config file path (default: "config/.env")
  -h, --help                 display help for command

```

### ds test command

`ds test` tests the connections to the database and the 3d printing sites used by design-stats. It can be used to test the configuration file or to quickly verify that the basic api and web scraping functions are working.

```bash
# test all connections
$ ds test
# output:
✔ Configuration loaded
✔ Thingiverse test connection for details successful: {"id":5249332,"title":"Banana 01","downloads":124,"likes":13}
✔ Thingiverse test connection for lists successful: Found 165 designs
✔ Cults3d test connection for details successful: {"id":"carafe-01","title":"Carafe 01","downloads":"14","likes":"4"}
✔ Printable test connection for details successful: {"id":"135167-banana-01","title":"Banana 01","downloads":"21","likes":"4"}
```

To test a specific connection the connection type can be added to the command. Valid connection types are:

- `thingiverse-api-details`: test the connection to the Thingiverse API and get the details of a specific design
- `thingiverse-api-list`: test the connection to the Thingiverse API and get the list of the user's designs
- `cults3d-details`: test the connection to the Cults 3d web site and scrape the details of a specific design
- `printable-details`: test the connection to the Cults 3d web site and scrape the details of a specific design
- `all`: test all connections

```bash
# test all connections
$ ds test thingiverse-api-details
# output:
✔ Configuration loaded
✔ Thingiverse test connection successful: {"id":5249332,"title":"Banana 01","downloads":123,"likes":13}
```
