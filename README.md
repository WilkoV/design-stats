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
    - [Execute all tests](#execute-all-tests)
    - [Execute specific tests](#execute-specific-tests)
  - [ds merge-sites command](#ds-merge-sites-command)
    - [Execute the command](#execute-the-command)
    - [Command options](#command-options)
  - [ds import-designs](#ds-import-designs)
    - [Execute the command](#execute-the-command-1)
    - [Command options](#command-options-1)

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

Copy `.env.template` to `.env` and amend the values that look like  `<...>`.

```bash
$ cp config/.env.template config/.env
$ vi config/.env
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
```

```txt
✔ Configuration loaded
✔ Thingiverse test connection for details successful: {"source":"Thingiverse","source_id":5249332,"title":"Banana 01","downloads":126,"likes":13}
✔ Thingiverse test connection for lists successful: Found 165 designs. First design: {"title":"Banana 02","source_id":5250995}
✔ Cults3d test connection for details successful: {"source":"Cults3d","source_id":"carafe-01","title":"Carafe 01","downloads":"14","likes":"4"}
✔ Cults3d test connection for lists successful: Found 165 designs. First design: {"title":"Banana 02","source":"Cults3d","source_id":"banana-02-wilko"}
✔ Printable test connection for details successful: {"source":"Printable","source_id":"135167-banana-01","title":"Banana 01","downloads":"22","likes":"4"}
✔ Printable test connection for lists successful: Found 165 designs. First design: {"title":"Stand for Santa Sleigh & Reindeer Christmas Decoration","source":"Printable","source_id":"184313-stand-for-santa-sleigh-reindeer-christmas-decorati"}
✔ Database table designs successfully tested with 165 entries
✔ Database table sources successfully tested with 495 entries
```

## Usage

After installation the command can be accessed by `design-stats` or `ds`. This document will use `ds`.

## ds help

### List all commands

```bash
# Show help and list of all commands
$ ds --help
# output:
```

```txt
Usage: ds [options] [command]

Collect statistical data from 3d printing sites

Options:
  -V, --version                    output the version number
  -h, --help                       show help

Commands:
  test [options] [connectionType]        Test connections to the database and 3d printing sites
  merge-sites [options]                  Get list of user's Thingiverse designs and match them with designs from cults3d and printable
  import-designs [options] [importFile]  Import design configurations for Thingiverse, cults3d and printable
  help [command]                         display help for command
```

### Get help for a specific command

`ds help [command]` shows the help of a specific command.

```bash
# Show help message for the test command
$ ds help test
# output
```

```txt
Usage: ds test [options] [connectionType]

Test connections to the database and 3d printing sites

Arguments:
  connectionType             Type of connection to test (choices: "thingiverse-api-details", "thingiverse-api-list", "cults3d-details",
                             "cults3d-list", "printable-details", "printable-list", "db", "db-tables", "all", default: "all")

Options:
  -c, --config <configFile>  config file path (default: "config/.env")
  -h, --help                 display help for command
```

## ds test command

`ds test` tests the connections to the database and the 3d printing sites used by design-stats. It can be used to test the configuration file or to quickly verify that the basic api and web scraping functions are working. By default the command uses the configuration file `config/.env`. This can be changed with the "-c" or "--config" option.

### Execute all tests

```bash
# test all connections
$ ds test
# output:
```

```txt
✔ Configuration loaded
✔ Thingiverse test connection for details successful: {"source":"Thingiverse","source_id":5249332,"title":"Banana 01","downloads":126,"likes":13}
✔ Thingiverse test connection for lists successful: Found 165 designs. First design: {"title":"Banana 02","source_id":5250995}
✔ Cults3d test connection for details successful: {"source":"Cults3d","source_id":"carafe-01","title":"Carafe 01","downloads":"14","likes":"4"}
✔ Cults3d test connection for lists successful: Found 165 designs. First design: {"title":"Banana 02","source":"Cults3d","source_id":"banana-02-wilko"}
✔ Printable test connection for details successful: {"source":"Printable","source_id":"135167-banana-01","title":"Banana 01","downloads":"22","likes":"4"}
✔ Printable test connection for lists successful: Found 165 designs. First design: {"title":"Stand for Santa Sleigh & Reindeer Christmas Decoration","source":"Printable","source_id":"184313-stand-for-santa-sleigh-reindeer-christmas-decorati"}
✔ Database table designs successfully tested with 165 entries
✔ Database table sources successfully tested with 495 entries

```

### Execute specific tests

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
# output:
```

```txt
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
✔ Database table designs successfully tested with 165 entries
✔ Database table sources successfully tested with 495 entries
```

## ds merge-sites command

`ds merge-sites` collects the designs from a user from the 3d printing sites and merges them into one file by title. Assuming the default base director is used it will create up t four files:

- data/export/merged-sites.json
- data/error/thingiverse-list.json
- data/error/cults3d-list.json
- data/error/printable-list.json

### Execute the command

```bash
ds merge-sites
# output:
```

```txt
✔ Configuration loaded
✔ User's Thingiverse designs loaded. Found 165 designs
✔ Designs from Cults3d loaded. Found 165 designs
✔ Designs from Printable loaded. Found 165 designs
✔ 165 merged designs written to file data\export\merged-sites.json
```

**Note: The command has to be run in an environment with an active display, because it will open a browser window to get the list of designs from Printable and Cults3d. In a headless environment the command will not work and produce an output like this:**

```txt
✔ Configuration loaded
✔ User's Thingiverse designs loaded. Found 165 designs
✖ Failed to load designs from Cults3d. Error: Error: Failed to launch the browser process!
[21027:21027:0515/124837.215457:ERROR:ozone_platform_x11.cc(247)] Missing X server or $DISPLAY
[21027:21027:0515/124837.215501:ERROR:env.cc(226)] The platform failed to initialize.  Exiting.


TROUBLESHOOTING: https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md

Error: Failed to launch the browser process!
[21027:21027:0515/124837.215457:ERROR:ozone_platform_x11.cc(247)] Missing X server or $DISPLAY
[21027:21027:0515/124837.215501:ERROR:env.cc(226)] The platform failed to initialize.  Exiting.


TROUBLESHOOTING: https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md
```

### Command options

The command has the following options:

- `-c, --config \<configFile\>` By default the command uses the configuration file `config/.env`. This option allows to specify a different configuration file in a different location.
- `-b, --baseDirectory \<baseDirectory\>` By default all exports are written to the base directory `data`. Depending on the content files are written to specific subdirectories. `export` for the merged sources and `error` for failed merges. This option allows to specify a different base directory.

## ds import-designs

`ds import-designs` imports the designs from the merge-sites file into the database. The command will create a new entry in the database for each design and for each source. Additionally imported and failed sources will be written to the base directory.Assuming the default base director is used it will create up t four files:

- data/export/import-designs.json
- data/error/failed-import-designs.json.json

### Execute the command

```bash
$ ds import-designs
# output:
```

```txt
✔ Configuration loaded
✔ Read 165 designs from data/import/merged-sites.json
✔   1/165: Imported Banana 02 from Cults3d
✔   1/165: Imported Banana 02 from Printable
✔   1/165: Imported Banana 02 from Thingiverse
...
✔ 165/165: Imported Raspberry Pi3  Model B Case from Cults3d
✔ 165/165: Imported Raspberry Pi3  Model B Case from Printable
✔ 165/165: Imported Raspberry Pi3  Model B Case from Thingiverse
✔ 165 imported designs written to file data/export/import-designs.json
```

### Command options

The command has the following options:

- `-c, --config \<configFile\>` By default the command uses the configuration file `config/.env`. This option allows to specify a different configuration file in a different location.
- `-b, --baseDirectory \<baseDirectory\>`  By default all exports are written to the base directory `data`. Depending on the content files are written to specific subdirectories. `export` for the imported designs and sources and `error` for failed imports. This option allows it to specify a different base directory.
- `-m, --verify-merged` By default sources with the processing status `merged` are not verifyed because the assumption is, that they're generated by the merge-sites command. So by default those are excluded. By setting this option the processing status `merged`will be ignored and they're treated like manually added entries.
- `-f, --overwrite-failed` Same behavior as for the `--verify-merged` option but for processing status `FAILED*`. This is usful if an error file is used for imports.
