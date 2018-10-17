#!/bin/bash


HOST='playground.lo'
PORT=9375

FOLDER=$1

output_format='{"path":"%p","event":"filechange"}'
watch_ext='js'

runWatcher()
{
	echo "{\"event\":\"initialize\",\"project_folder\":\"$FOLDER\",\"rel\":\"$PWD\"}"

	fswatch -0 --latency=0.1 --format=$output_format -r -e ".*" -i "\\.$watch_ext$" $FOLDER |
		while read -d "" path ;
			do
			echo $path;
		done;
}

runWatcher | nc $HOST $PORT

