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

# Cults3d user name
DS_CULTS_USERNAME=<your-cults3d-user-name>
# Timeout for fetching details from Cults3d web site
DS_CULTS_TIMEOUT=10000
# Design on Cults3d that could be used by the test command
DS_CULTS_TEST_ID=<your-cults3d-design-id>

#
# Printable configuration
#

# Printable user id. Goto your about page and copy the id from it. 
# The pattern is: https://www.printables.com/social/<your_user_id>/about
DS_PRINTABLE_USER_ID=<your-printable-user-id>
# Design on Printable that could be used by the test command
DS_PRINTABLE_TEST_ID=<your-printable-design-id>

#
# PostgreSQL database configuration
#

# Name of the host that serves the PostgresSQL database
DS_POSTGRES_HOST=localhost
# Port of the host that serves the postgresql database
DS_POSTGRES_PORT=5432
# Connection user for the PostgresSQL database
DS_POSTGRES_USER=ds
# Password for the PostgresSQL database
DS_POSTGRES_PASSWORD=<your-postgres-password>
# Name of the database
DS_POSTGRES_DB=ds_db
# Connection timeout in milliseconds
DS_POSTGRES_DB_CONNECTION_TIMEOUT=30000
# Idle timeout in milliseconds
DS_POSTGRES_DB_IDLE_TIMEOUT=60000
# Minimum number of connections in the pool
DS_POSTGRES_DB_MIN_CONNECTIONS=0
# Maximum number of connections in the pool
DS_POSTGRES_DB_MAX_CONNECTIONS=10

#
# pgAdmin / PostgreSQL database UI configuration
#

# pgAdmin username
DS_PGADMIN_DEFAULT_EMAIL=<your-pg-admin-email>
# pgAdmin password
DS_PGADMIN_DEFAULT_PASSWORD=<your-pg-admin-password>
DS_PGADMIN_DEFAULT_PORT=5050
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

```txt
# output:
✔ Configuration loaded
✔ Thingiverse test connection for details successful: {"source":"Thingiverse","source_id":5249332,"title":"Banana 01","downloads":126,"likes":13}
✔ Thingiverse test connection for lists successful: Found 165 designs. First design: {"title":"Banana 02","source_id":5250995}
✔ Cults3d test connection for details successful: {"source":"Cults3d","source_id":"carafe-01","title":"Carafe 01","downloads":"14","likes":"4"}
✔ Cults3d test connection for lists successful: Found 165 designs. First design: {"title":"Banana 02","source":"Cults3d","source_id":"banana-02-wilko"}
✔ Printable test connection for details successful: {"source":"Printable","source_id":"135167-banana-01","title":"Banana 01","downloads":"22","likes":"4"}
✔ Printable test connection for lists successful: Found 165 designs. First design: {"title":"Stand for Santa Sleigh & Reindeer Christmas Decoration","source":"Printable","source_id":"184313-stand-for-santa-sleigh-reindeer-christmas-decorati"}
```

## Usage

After installation the command can be accessed by `design-stats` or `ds`. This document will use `ds`.

## ds help

### List all commands

```bash
# Show help and list of all commands
$ ds --help
```

```txt
# output:
Usage: ds [options] [command]

Collect statistical data from 3d printing sites

Options:
  -V, --version                    output the version number
  -h, --help                       show help

Commands:
  test [options] [connectionType]  Test connections to the database and 3d printing sites
  merge-sites [options]            Get list of user's Thingiverse designs and match them with designs from cults3d and printable
  help [command]                   display help for command
```

### Get help for a specific command

`ds help [command]` shows the help of a specific command.

```bash
# Show help message for the test command
$ ds help test
```

```txt
# output
Usage: ds test [options] [connectionType]

Test connections to the database and 3d printing sites

Arguments:
  connectionType             Type of connection to test (choices: "thingiverse-api-details", "thingiverse-api-list", "cults3d-details", "cults3d-list",
                             "printable-details", "printable-list", "db", "db-tables", "all", default: "all")

Options:
  -c, --config <configFile>  config file path (default: "config/.env")
  -h, --help                 display help for command
```

### ds test command

`ds test` tests the connections to the database and the 3d printing sites used by design-stats. It can be used to test the configuration file or to quickly verify that the basic api and web scraping functions are working. By default the command uses the configuration file `config/.env`. This can be changed with the "-c" or "--config" option.

```bash
# test all connections
$ ds test
```

```txt
# output:
✔ Configuration loaded
✔ Thingiverse test connection for details successful: {"source":"Thingiverse","source_id":5249332,"title":"Banana 01","downloads":126,"likes":13}
✔ Thingiverse test connection for lists successful: Found 165 designs. First design: {"title":"Banana 02","source_id":5250995}
✔ Cults3d test connection for details successful: {"source":"Cults3d","source_id":"carafe-01","title":"Carafe 01","downloads":"14","likes":"4"}
✔ Cults3d test connection for lists successful: Found 165 designs. First design: {"title":"Banana 02","source":"Cults3d","source_id":"banana-02-wilko"}
✔ Printable test connection for details successful: {"source":"Printable","source_id":"135167-banana-01","title":"Banana 01","downloads":"22","likes":"4"}
✔ Printable test connection for lists successful: Found 165 designs. First design: {"title":"Stand for Santa Sleigh & Reindeer Christmas Decoration","source":"Printable","source_id":"184313-stand-for-santa-sleigh-reindeer-christmas-decorati"}
✔ Database table designs successfully tested with 0 entries
✔ Database table sources successfully tested with 0 entries

```

To test a specific connection the connection type can be added to the command. Valid connection types are:

- `thingiverse-api-details`: test the connection to the Thingiverse API and get the details of a specific design
- `thingiverse-api-list`: test the connection to the Thingiverse API and get the list of the user's designs
- `cults3d-details`: test the connection to the Cults 3d web site and scrape the details of a specific design
- `cults3d-list`: test the connection to the Cults 3d web site and scrape the list of user's designs
- `printable-details`: test the connection to the Cults 3d web site and scrape the details of a specific design
- `printable-list`: test the connection to the Cults 3d web site and scrape the list of user's designs
- `db`: test the connection to the database and get the list of all designs
- `db-tables`: test the connection to the database and get the number of entries of all tables
- `all`: test all connections

```bash
# test all connections
$ ds test thingiverse-api-details
```

```txt
# output:
✔ Configuration loaded
✔ Thingiverse test connection successful: {"id":5249332,"title":"Banana 01","downloads":123,"likes":13}
```

**Note: The command has to be run in an environment with an active display, because it will open a browser window to get the list of designs from Printable and Cults3d. In a headless environment the command will not work and produce an output like this:**

```txt
✔ Configuration loaded
✔ Thingiverse test connection for details successful: {"source":"Thingiverse","source_id":5249332,"title":"Banana 01","downloads":127,"likes":13}
✔ Thingiverse test connection for lists successful: Found 165 designs. First design: {"title":"Banana 02","source":"Thingiverse","source_id":5250995}
✔ Cults3d test connection for details successful: {"source":"Cults3d","source_id":"carafe-01","title":"Carafe 01","downloads":"14","likes":"4"}
✖ Cults3d test connection for lists failed: Error: Failed to launch the browser process!
[20696:20696:0515/124403.678533:ERROR:ozone_platform_x11.cc(247)] Missing X server or $DISPLAY
[20696:20696:0515/124403.678589:ERROR:env.cc(226)] The platform failed to initialize.  Exiting.


TROUBLESHOOTING: https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md

✔ Printable test connection for details successful: {"source":"Printable","source_id":"135167-banana-01","title":"Banana 01","downloads":"23","likes":"4"}
✖ Printable test connection for lists failed: Error: Failed to launch the browser process!
[20792:20792:0515/124407.563645:ERROR:ozone_platform_x11.cc(247)] Missing X server or $DISPLAY
[20792:20792:0515/124407.563677:ERROR:env.cc(226)] The platform failed to initialize.  Exiting.


TROUBLESHOOTING: https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md
✔ Database table designs successfully tested with 0 entries
✔ Database table sources successfully tested with 0 entries
```
