#!/bin/bash


HOST='playground.lo'
PORT=9375

PROJECT=$1

output_format='{"path":"%p","driver":"filewatcher"}'
watch_ext='js'

runWatcher()
{
	echo "{\"project_folder\":\"$PROJECT\"}"
	fswatch --latency=0.1 -r --format=$output_format -i "\\.$watch_ext$" $PROJECT
}

echo "Run connection to ${PORT}:${HOST}."
runWatcher | nc $HOST $PORT
