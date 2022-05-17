#!/usr/bin/bash

mkdir -p ../data/backup

docker exec -t ds-db pg_dump --username "ds" --no-password --format=p --schema-only --encoding "UTF8" "ds_db" > ../data/backup/schema_`date +%d-%m-%Y"_"%H_%M_%S`.sql
