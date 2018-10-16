#!/bin/sh
set -ex

go get -d -t ./...
go fix ./...
go vet ./...
go fmt ./...
