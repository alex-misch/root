#!/bin/sh
set -eux

FOLDER=$1

runWatcher() {
	printf '{"event":"initialize","project_folder":"%s","working_directory":"%s"}' $FOLDER $PWD
	fswatch -0 --latency=0.1 -r "$FOLDER/src/"
}

runWatcher | nc 'bmp.lo' 9375 | cat


