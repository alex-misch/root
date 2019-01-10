#!/bin/sh
set -eux

# main entrypoint for docker container microsecvice run
# .scripts/run-go.sh 'ci'
.scripts/run-node.sh 'ssr-bmpjs'
