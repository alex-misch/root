#!/bin/sh
set -eux

# if first arg is node in monorepo graph - apply commands to this node (package),
# otherwise - to root (all repo nodes)
NODE=${1:-.}

go get -d ./${NODE}/...

# calculate base variables
BASE=`basename "${NODE}"`
TIMESTAMP=`date +%s`
VERSION="${CIRCLE_TAG:=LOCAL}"

# calculate build/compile specific variables
ldflags="-X 'main.NODE=${BASE}' -X 'main.VERSION=${VERSION}' -X 'main.TIMESTAMP=${TIMESTAMP}'"

### COMPILE

# linux 64 bit (alpine, ubuntu)
GOOS=linux GOARCH=amd64 go build \
	-v \
	-buildmode=plugin \
	-ldflags "${ldflags}" \
	-o /go/bin/${BASE}-Linux-x86_64.so \
	./${NODE} # otherwise -> go build: cannot use -o with multiple packages
