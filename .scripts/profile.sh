#!/bin/sh
set -eux

# if first arg is node in monorepo graph - apply commands to this node (package),
# otherwise - to root (all repo nodes)
NODE=${1:-.}
BASE=`basename "${NODE}"`

# run benchmarks with profiling
go get -d -t ./${NODE}/...
go clean -testcache || true
go test -race -run=^$$ -bench=. -benchmem \
	-cpuprofile ${BASE}-cpu.prof \
	-memprofile ${BASE}-mem.prof \
	./${NODE}/...

# generate graph and binary output
apt-get update
apt-get install -y graphviz gv

go tool pprof -svg /go/bin/base-Linux-x86_64 ${BASE}-cpu.prof > ${BASE}-cpu.svg
go tool pprof -svg /go/bin/base-Linux-x86_64 ${BASE}-mem.prof > ${BASE}-mem.svg
