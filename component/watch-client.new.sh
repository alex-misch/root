#!/bin/bash


HOST='playground.lo'
PORT=9375

FOLDER=$1

output_format='{"path":"%p","event":"filechange"}'
watch_ext='js'


exec 5<>/dev/tcp/$HOST/$PORT
echo -e "{\"event\":\"initialize\",\"project_folder\":\"$FOLDER\",\"rel\":\"$PWD\"}" >&5

fswatch -0 --latency=0.1 --format=$output_format -r -e ".*" -i "\\.$watch_ext$" $FOLDER |
	while read -d "" path ;
		do
		echo $path>&5;
	done;
