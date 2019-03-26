#!/bin/sh
set -eux

# main entrypoint for docker container microservice run
NODE='ci'

# run script based on launch type
.scripts/run-go.sh ${NODE}
# .scripts/run-node.sh ${NODE}
