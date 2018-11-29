package main

import (
	"github.com/boomfunc/root/base/cli"
)

var VERSION string
var TIMESTAMP string

func main() {
	cli.Run(VERSION, TIMESTAMP)
}
