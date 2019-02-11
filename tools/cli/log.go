package cli

import (
	"runtime"
	"time"

	"github.com/boomfunc/root/tools/log"
	"github.com/urfave/cli"
)

var (
	Authors = []cli.Author{
		{
			Name:  "Alexander Gurinov",
			Email: "alexander.gurinov@gmail.com",
		},
		{
			Name:  "Alexey Yollov",
			Email: "yollov@me.com",
		},
	}
)

// TODO: look at rfc for more useful logging
// https://tools.ietf.org/html/rfc7231#section-7.4.2
// https://tools.ietf.org/html/rfc7231#section-5.5.3
func StartupLog(node, version string, compiled time.Time) {
	log.Infof("************************************************************")
	log.Infof("Boomfunc `%s` version:\t%s", log.Wrap(node, log.Bold), log.Wrap(version, log.Bold))
	log.Infof("Boomfunc `%s` compilation time:\t%s", log.Wrap(node, log.Bold), log.Wrap(compiled, log.Bold))
	log.Infof("OS / ARCH:\t%s / %s", log.Wrap(runtime.GOOS, log.Bold), log.Wrap(runtime.GOARCH, log.Bold))
	log.Infof("************************************************************")
	log.Infof("")
}
