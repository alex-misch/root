#!/bin/sh

<< ////

TODO:
use cross-compiling
$go get github.com/mitchellh/gox
$gox \
	-verbose \
	-osarch="linux/amd64 darwin/amd64" \
	-ldflags="-X main.VERSION=$CIRCLE_TAG -X main.TIMESTAMP=`date +%s`" \
	-output="/go/bin/{{.Dir}}-{{.OS}}-{{.Arch}}"

////

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

# compile and build
# linux 64 bit
# - alpine, ubuntu
go build \
	-v \
	-buildmode=plugin \
	-ldflags "${ldflags}" \
	-o /go/bin/${BASE}.so \
	./${NODE} # otherwise -> go build: cannot use -o with multiple packages
