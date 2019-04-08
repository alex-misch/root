#!/bin/sh
set -eux

# TODO: deal with -gcflags=-m
# escaping analysis

# if first arg is node in monorepo graph - apply commands to this node (package),
# otherwise - to root (all repo nodes)
NODE=${1:-.}

# .scripts/build-bin.sh ${NODE}
.scripts/build-plugin.sh ${NODE}
