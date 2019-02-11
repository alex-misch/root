package cli

import (
	"os"
	"sort"
	"strconv"
	"time"

	tcli "github.com/boomfunc/root/tools/cli"
	"github.com/urfave/cli"
)

const (
	USAGE = "Boomfunc Continuous Integration service"
)

func Run(NODE, VERSION, TIMESTAMP string) {
	// prepare build variables passed through -ldflags
	ts, err := strconv.ParseInt(TIMESTAMP, 10, 64)
	if err != nil {
		panic(err)
	}
	// Phase 1. Get cli options, some validation checks and configure working env
	// errors from this phase must be paniced with traceback and os.exit(1)
	app := cli.NewApp()
	app.Name = NODE
	app.Version = VERSION
	app.Compiled = time.Unix(ts, 0)
	app.Authors = tcli.Authors
	app.Usage = USAGE
	app.Flags = []cli.Flag{
		cli.BoolFlag{
			Name:   "debug",
			Usage:  debugFlagUsage,
			EnvVar: "BMP_DEBUG_MODE",
		},
	}
	app.Commands = []cli.Command{
		{
			Name:  "session",
			Usage: sessionCommandUsage,
			Flags: []cli.Flag{
				cli.StringFlag{
					Name:   "origin",
					Usage:  originFlagUsage,
					EnvVar: "BMP_CI_ORIGIN",
				},
				cli.StringFlag{
					Name:   "ref",
					Usage:  refFlagUsage,
					EnvVar: "BMP_CI_REF",
					Value:  "refs/heads/master",
				},
			},
			Subcommands: []cli.Command{
				{
					Name:   "run",
					Usage:  runSessionCommandUsage,
					Action: runCommandAction,
				},
			},
		},
	}
	// configure sorting for help
	sort.Sort(cli.FlagsByName(app.Flags))
	sort.Sort(cli.CommandsByName(app.Commands))
	// run
	app.Run(os.Args)
}
