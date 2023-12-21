#!/usr/bin/bash

echo "Get data from the sources and update statistics"

cd ..
ds updateStatistics --source Printables

echo "Backup database files"

cd -
./backup.sh

echo "Show Statistics"

cd ..
# clear
ds show sourceStatistics --statisticType downloads --source Printables
cd -
