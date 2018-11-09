#!/bin/sh
set -eux

go get -d -t ./ci/...
go clean -testcache || true
# go test  -v -race -cover ./...
go test  -v -race -cover ./ci
# go test -race -cover tools/context_test.go
