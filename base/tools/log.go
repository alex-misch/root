package tools

import (
	"os"

	"github.com/boomfunc/root/tools/log"
)

// TODO clear Stack (runtime.debug.Stack())
func ErrorLog(err interface{}) {
	log.Errorf("%s\n%s", err, "<TRACE(TODO:uuid): TODO: content>")
}

func FatalLog(err interface{}) {
	ErrorLog(err)
	os.Exit(1)
}
