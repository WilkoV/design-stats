#!/usr/bin/bash

mkdir -p ../data/backup

docker exec -t ds-db pg_dumpall -c -U ds > ../data/backup/dump_`date +%d-%m-%Y"_"%H_%M_%S`.sql
