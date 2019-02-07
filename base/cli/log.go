package cli

import (
	"time"

	"github.com/boomfunc/root/tools/log"
)

func StartupLog(name, version string, compiled time.Time) {
	log.Infof("************************************************************")
	log.Infof("Boomfunc `%s` version:\t%s", log.Wrap(name, log.Bold), log.Wrap(version, log.Bold))
	log.Infof("Boomfunc `%s` compilation time:\t%s", log.Wrap(name, log.Bold), log.Wrap(compiled, log.Bold))
	log.Infof("************************************************************")
	log.Infof("")
}
