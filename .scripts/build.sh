#!/bin/sh
set -eux

# if first arg is node in monorepo graph - apply commands to this node (package),
# otherwise - to root (all repo nodes)
# NODE=${1:-.}
NODE='ssr-bmpjs'

.scripts/build-plugin.sh ${NODE}
