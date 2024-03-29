#!/usr/bin/bash

# create processing directories
mkdir -p ../data/export
mkdir -p ../data/error

# create database directories
mkdir -p ../data/backup
mkdir -p ../data/db-data
mkdir -p ../data/pgadmin-data
mkdir -p ../data/grafana-data

sudo chown -R 5050:5050  ../data/pgadmin-data
sudo chown -R 472:472  ../data/grafana-data
