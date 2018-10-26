#!/bin/bash

HOST='bmp.lo'
PORT=9375

ACTION=$1
FOLDER=$2

event() {
	printf '{"task":"%s","project_folder":"%s","working_directory":"%s"}' $1 $FOLDER $PWD
}

runWatcher() {
	event watch
	fswatch -0 --latency=0.1 -r $FOLDER
}

echo "Run action $ACTION..."
if [[ $ACTION == 'watch' ]]; then
	runWatcher | nc $HOST $PORT
elif [[ $ACTION == 'build' ]]; then
	event build | nc $HOST $PORT
else
	echo "ERROR: Action "$ACTION" not specified."
fi

