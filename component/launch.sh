#!/bin/bash

HOST='playground.lo'
PORT=9375

ACTION=$1
FOLDER=$2

output_format='{"path":"%p","task":"filechange"}'
watch_ext='js'

event() {
	printf '{"task":"%s","project_folder":"%s","working_directory":"%s"}' $1 $FOLDER $PWD
}

runWatcher() {
	event watch
	fswatch -0 --latency=0.1 --format=$output_format -r -e ".*" -i "\\.$watch_ext$" $FOLDER |
		while read -d "" path; do
			echo $path;
		done;
}

echo "Run action $ACTION..."
if [[ $ACTION == 'watch' ]]; then
	runWatcher | nc $HOST $PORT
else
	event build | nc $HOST $PORT
fi

