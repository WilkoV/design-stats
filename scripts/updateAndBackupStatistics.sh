#!/usr/bin/bash

cd ..
ds updateStatistics
cd -
./backup.sh

cd ..
clear
ds show sourceStatistics --statisticType downloads
cd -
