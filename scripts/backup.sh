#!/usr/bin/bash

time_stamp=`date +%Y-%m-%d"_"%H_%M_%S`
prefix=""

if [ -z $1 ]; then
   prefix=${time_stamp}
else
   prefix=$1
fi

mkdir -p ../data/backup/${prefix}

# backup data
docker exec -t ds-db pg_dump --username "ds" --no-password --format=p --data-only --blobs --encoding "UTF8" "ds_db" > ../data/backup/${prefix}/data_copy.sql
docker exec -t ds-db pg_dump --username "ds" --no-password --format=p --data-only --inserts --blobs --encoding "UTF8" "ds_db" > ../data/backup/${prefix}/data_inserts.sql

# backup schema
docker exec -t ds-db pg_dump --username "ds" --no-password --format=p --schema-only --encoding "UTF8" "ds_db" > ../data/backup/${prefix}/schema.sql

# dump all
docker exec -t ds-db pg_dumpall -c -U ds > ../data/backup/${prefix}/dump.sql

cp ../config/.env ../data/backup/${prefix}/.env
cp ../data/import/mergedSites.json ../data/backup/${prefix}/mergedSites.json

./copyToGoogleDrive.sh ${prefix}
