package main

import (
	"github.com/boomfunc/root/ci/cli"
)

var (
	NODE      string // name of the node for which the CLI interface is started
	VERSION   string // a version of the node (compile-time variable)
	TIMESTAMP string // when the node was built (compile-time variable)
)

func main() {
	cli.Run(NODE, VERSION, TIMESTAMP)
}
