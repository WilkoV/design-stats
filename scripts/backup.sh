#!/usr/bin/bash

time_stamp=`date +%Y-%m-%d"_"%H_%M_%S`

mkdir -p ../data/backup/$time_stamp

# backup data
docker exec -t ds-db pg_dump --username "ds" --no-password --format=p --data-only --blobs --encoding "UTF8" "ds_db" > ../data/backup/${time_stamp}/data_copy.sql
docker exec -t ds-db pg_dump --username "ds" --no-password --format=p --data-only --inserts --blobs --encoding "UTF8" "ds_db" > ../data/backup/${time_stamp}/data_inserts.sql

# backup schema
docker exec -t ds-db pg_dump --username "ds" --no-password --format=p --schema-only --encoding "UTF8" "ds_db" > ../data/backup/${time_stamp}/schema.sql

# dump all
docker exec -t ds-db pg_dumpall -c -U ds > ../data/backup/${time_stamp}/dump.sql