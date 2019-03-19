#!/bin/sh
set -eux

# if first arg is node in monorepo graph - apply commands to this node (package),
# otherwise - to root (all repo nodes)
NODE=${1:-.}
NODE='base/pipeline'

go get -d -t ./${NODE}/...
go clean -testcache || true
GOGC=off go test -run=^$$ -bench=. -benchmem \
	-benchtime=2s \
	./${NODE}/...
