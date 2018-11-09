#!/bin/sh
set -eux

go get -d -t ./...
go test -cpuprofile cpu.prof -memprofile mem.prof ./pipeline
