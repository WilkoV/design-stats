# design-stats

Collects statistical data from 3d printing sites like Thingiverse, Cults3d or Printable

- [1. Installation](#1-installation)
  - [1.1. Requirements](#11-requirements)
  - [1.2. Clone from git](#12-clone-from-git)
  - [1.3. Create configuration file](#13-create-configuration-file)
  - [1.4. Install design-stats (ds)](#14-install-design-stats-ds)
- [2. Usage](#2-usage)
  - [2.1. ds help](#21-ds-help)
    - [2.1.1. List all commands](#211-list-all-commands)
    - [2.1.2. Get help for a specific command](#212-get-help-for-a-specific-command)
  - [2.2. ds merge-sites command](#22-ds-merge-sites-command)
    - [2.2.1. Merge-sites command options](#221-merge-sites-command-options)
    - [2.2.2. Execute the merge-sites command](#222-execute-the-merge-sites-command)
  - [2.3. ds import-designs](#23-ds-import-designs)
    - [2.3.1. ds import-designs options](#231-ds-import-designs-options)
    - [2.3.2. Import-designs command options](#232-import-designs-command-options)
    - [2.3.3. Execute the import-designs command (default scenario)](#233-execute-the-import-designs-command-default-scenario)
  - [2.4. ds update-statistics command](#24-ds-update-statistics-command)
    - [2.4.1. Execute the update-statistics command (default scenario)](#241-execute-the-update-statistics-command-default-scenario)
    - [2.4.2. Execute the update-statistics command with adjusted date](#242-execute-the-update-statistics-command-with-adjusted-date)
    - [2.4.3. Execute the update-statistics command for one design and source](#243-execute-the-update-statistics-command-for-one-design-and-source)
    - [2.4.4. Execute the update-statistics command for one source](#244-execute-the-update-statistics-command-for-one-source)
    - [2.4.5. ds update-statistics options](#245-ds-update-statistics-options)
  - [2.5. ds test command](#25-ds-test-command)
    - [2.5.1. Execute all tests](#251-execute-all-tests)
    - [2.5.2. Execute specific tests](#252-execute-specific-tests)

## 1. Installation

### 1.1. Requirements

- [nodejs](https://nodejs.org/en/)
- [Thingiverse API key](https://www.thingiverse.com/developers/apps)

### 1.2. Clone from git

```bash
# clone the repository
$ git clone https://github.com/WilkoV/design-stats.git
$ cd design-stats
```

### 1.3. Create configuration file

Copy `.env.template` to `.env` and amend the values that look like  `<...>`.

```bash
cp config/.env.template config/.env
$ vi config/.env
```

### 1.4. Install design-stats (ds)

```bash
# Install nodejs dependencies
$ npm install

# Install command globally 
$ npm install -g
```

The installation can be tested with the [ds test command](#ds-test-command). It will test the list and details connection to the different 3d printing sites, test the db connection and will query each table in the database.

## 2. Usage

After installation the command can be accessed by `design-stats` or `ds`. This document will use `ds`.

### 2.1. ds help

#### 2.1.1. List all commands

```bash
# Show help and list of all commands
$ ds --help

# output:
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

#### 2.1.2. Get help for a specific command

`ds help [command]` shows the help of a specific command.

```bash
# Show help message for the test command
$ ds help test

# output
Usage: ds test [options] [connectionType]

Test connections to the database and 3d printing sites

Arguments:
  connectionType             Type of connection to test (choices: "thingiverse-api-details", "thingiverse-api-list", "cults3d-details",
                             "cults3d-list", "printable-details", "printable-list", "db", "all", default: "all")

Options:
  -c, --config <configFile>  config file path (default: "config/.env")
  -h, --help                 display help for command
```

### 2.2. ds merge-sites command

`ds merge-sites` collects the designs from a user from the 3d printing sites and merges them into one file by title. Assuming the default base director is used it will create up t four files:

- data/export/merged-sites.json
- data/error/thingiverse-list.json
- data/error/cults3d-list.json
- data/error/printable-list.json

#### 2.2.1. Merge-sites command options

The command has the following options:

- `-c, --config \<configFile\>` By default the command uses the configuration file `config/.env`. This option allows to specify a different configuration file in a different location.
- `-b, --baseDirectory \<baseDirectory\>` By default all exports are written to the base directory `data`. Depending on the content files are written to specific subdirectories. `export` for the merged sources and `error` for failed merges. This option allows to specify a different base directory.

#### 2.2.2. Execute the merge-sites command

```bash
ds merge-sites

# output:
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

### 2.3. ds import-designs

`ds import-designs` imports the designs from the merge-sites file into the database. The command will create a new entry in the database for each design and for each source. Additionally imported and failed sources will be written to the base directory.Assuming the default base director is used it will create up t four files:

- data/export/import-designs.json
- data/error/failed-import-designs.json.json

#### 2.3.1. ds import-designs options

#### 2.3.2. Import-designs command options

The command has the following options:

- `-c, --config \<configFile\>` By default the command uses the configuration file `config/.env`. This option allows to specify a different configuration file in a different location.
- `-b, --baseDirectory \<baseDirectory\>`  By default all exports are written to the base directory `data`. Depending on the content files are written to specific subdirectories. `export` for the imported designs and sources and `error` for failed imports. This option allows it to specify a different base directory.
- `-m, --verify-merged` By default sources with the processing status `merged` are not verified because the assumption is, that they're generated by the merge-sites command. So by default those are excluded. By setting this option the processing status `merged`will be ignored and they're treated like manually added entries.
- `-f, --overwrite-failed` Same behavior as for the `--verify-merged` option but for processing status `FAILED*`. This is useful if an error file is used for imports.

#### 2.3.3. Execute the import-designs command (default scenario)

```bash

$ ds import-designs

# output:
✔ Configuration loaded
✔ Schema version is correct
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

### 2.4. ds update-statistics command

`ds update-statistics` updates the statistics for all configured designs from all sources in the database. It performs following steps per design / source:

- get the totals for downloads, likes, views, makes, remixes, comments, collections from the 3d printing sites:
- calculate the daily and periodical data
- store the data in the database. Following tables are used
  - imports: This table contains the totals for each day. This table is used to calculate the daily data points and can be used to recalculate the statistic tables. 1 row per day / design / source.
  - daily_statistics: This table contains the daily data points. 1 row per day / design / source.
  - statistics: This table contains the periodical data points. 1 row per year / day / design / source / data point.

#### 2.4.1. Execute the update-statistics command (default scenario)

```bash
$ ds update-statistics

# output:
✔ importDate is set to 2022-06-03
✔ Configuration loaded
✔ Schema version is correct
✔ Got 498 sources
✔   1/498: Banana 02 from Cults3d processed
✔   2/498: Banana 02 from Printables processed
✔   3/498: Banana 02 from Thingiverse processed
...
✔  34/498: Woodturning Bowl 06 (Sleeper Bowl) from Cults3d processed
⚠  35/498: Woodturning Bowl 06 (Sleeper Bowl) from Printables--> error: title is not valid --> retrying later
✔  36/498: Woodturning Bowl 06 (Sleeper Bowl) from Thingiverse processed
✔  37/498: Woodturning Vase 05 from Cults3d processed
...
✔ 498/498: Cookie Cutter Heart (1x1) from Thingiverse processed
✔  35/498 (retry): Woodturning Bowl 06 (Sleeper Bowl) from Printables processed
```

TODO: Add output

#### 2.4.2. Execute the update-statistics command with adjusted date

```bash
$ ds update-statistics --date 2022-06-02

# output:
✔ importDate is set to 2022-06-02
✔ Configuration loaded
✔ Schema version is correct
✔ Got 498 sources
...
```

#### 2.4.3. Execute the update-statistics command for one design and source

```bash
$ ds update-statistics --designId 86 --source Printables

# output:
✔ importDate is set to 2022-06-03
✔ Setting design ID filter to 86
✔ Setting source filter to Printables
✔ Configuration loaded
✔ Schema version is correct
✔ Got 1 sources
✔ 1/1: Stackable Planter (110mm) from Printables processed
```

#### 2.4.4. Execute the update-statistics command for one source

```bash
$ ds update-statistics --source Printables

# output:
✔ importDate is set to 2022-06-03
✔ Setting design ID filter to undefined
✔ Setting source filter to Printables
✔ Configuration loaded
✔ Schema version is correct
✔ Got 166 sources
✔   1/166: Banana 02 from Printables processed
...
```

#### 2.4.5. ds update-statistics options

- `-c, --config \<configFile\>` By default the command uses the configuration file `config/.env`. This option allows to specify a different configuration file in a different location.
- `-i, --importDate <importDate>` By default the command uses the current date. This option allows to specify a different date that is used during the update process. The date has to be in the format `YYYY-MM-DD`.
- `-d, --design <designId>` By default the command updates all designs. This option allows to specify the database ID of a single design that is updated. A design can have multiple sources. To update a single source use the `--source` option.
- `-s, --source <sourceType>` By default the command updates all sources. This option allows to specify a single source that is updated. Valid sources are: `Cults3d`, `Printables`, `Thingiverse`. To update a single design use the `--design` option.

### 2.5. ds test command

`ds test` tests the connections to the database and the 3d printing sites used by design-stats. It can be used to test the configuration file or to quickly verify that the basic api and web scraping functions are working. By default the command uses the configuration file `config/.env`. This can be changed with the "-c" or "--config" option.

#### 2.5.1. Execute all tests

```bash
# test all connections
$ ds test

# output:
✔ Configuration loaded
✔ Thingiverse test connection for details successful: {"source":"Thingiverse","source_id":5249332,"title":"Banana 01","downloads":126,"likes":13}
✔ Thingiverse test connection for lists successful: Found 165 designs. First design: {"title":"Banana 02","source_id":5250995}
✔ Cults3d test connection for details successful: {"source":"Cults3d","source_id":"carafe-01","title":"Carafe 01","downloads":"14","likes":"4"}
✔ Cults3d test connection for lists successful: Found 165 designs. First design: {"title":"Banana 02","source":"Cults3d","source_id":"banana-02-wilko"}
✔ Printable test connection for details successful: {"source":"Printable","source_id":"135167-banana-01","title":"Banana 01","downloads":"22","likes":"4"}
✔ Printable test connection for lists successful: Found 165 designs. First design: {"title":"Stand for Santa Sleigh & Reindeer Christmas Decoration","source":"Printable","source_id":"184313-stand-for-santa-sleigh-reindeer-christmas-decorati"}
✔ Database connection successfully tested at Thu Jun 02 2022 11:31:22 GMT+0200 (Central European Summer Time)
✔ Database schema version is 1
✔ Database table designs successfully tested with 166 entries
✔ Database table sources successfully tested with 498 entries
✔ Database table imports successfully tested with 996 entries
✔ Database table daily_statistics successfully tested with 996 entries
✔ Database table statistics successfully tested with 6972 entries

```

**Note: Some test have to be executed in an environment with an active display, because it will open a browser window to get the list of designs from Printable and Cults3d. In a headless environment the command will not work and produce an output like this:**

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
✔ Database connection successfully tested at Fri May 20 2022 13:31:43 GMT+0200 (Central European Summer Time)
✔ Database connection successfully tested at Thu Jun 02 2022 11:31:22 GMT+0200 (Central European Summer Time)
✔ Database schema version is 1
✔ Database table designs successfully tested with 166 entries
✔ Database table sources successfully tested with 498 entries
✔ Database table imports successfully tested with 996 entries
✔ Database table daily_statistics successfully tested with 996 entries
✔ Database table statistics successfully tested with 6972 entries
```

#### 2.5.2. Execute specific tests

To test a specific connection the connection type can be added to the command. Valid connection types are:

- `thingiverse-api-details`: test the connection to the Thingiverse API and get the details of a specific design
- `thingiverse-api-list`: test the connection to the Thingiverse API and get the list of the user's designs
- `cults3d-details`: test the connection to the Cults 3d web site and scrape the details of a specific design
- `cults3d-list`: test the connection to the Cults 3d web site and scrape the list of user's designs
- `printable-details`: test the connection to the Cults 3d web site and scrape the details of a specific design
- `printable-list`: test the connection to the Cults 3d web site and scrape the list of user's designs
- `db`: test the connection to the database and get the list of all designs
- `all`: test all connections

```bash
# test all connections
$ ds test thingiverse-api-details

# output:
✔ Configuration loaded
✔ Thingiverse test connection successful: {"id":5249332,"title":"Banana 01","downloads":123,"likes":13}
```
