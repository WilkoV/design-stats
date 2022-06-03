#!/usr/bin/bash

# check for arguments
if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# check if backup file exists
if [ ! -e $1 ]; then
    echo "Backup file $1 does not exist"
    exit 1
fi


cat $1 | docker exec -i ds-db psql -U ds -d ds_db
