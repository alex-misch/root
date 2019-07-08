package cli

import (
	"os"
	"runtime"
	"sort"
	"strconv"
	"time"

	tcli "github.com/boomfunc/root/tools/cli"
	"github.com/urfave/cli"
)

const (
	USAGE = "Boompack service application"
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
			EnvVar: "BMP_BASE_DEBUG_MODE",
		},
	}
	app.Commands = []cli.Command{
		{
			Name:  "run",
			Usage: runCommandUsage,
			Flags: []cli.Flag{
				cli.IntFlag{
					Name:   "port",
					Usage:  portFlagUsage,
					EnvVar: "BMP_BASE_PORT",
					Value:  8080,
				},
				cli.IntFlag{
					Name:   "workers",
					Usage:  portFlagUsage,
					EnvVar: "BMP_BASE_WORKER_NUM",
					Value:  runtime.NumCPU(),
				},
				cli.StringFlag{
					Name:   "config",
					Usage:  configFlagUsage,
					EnvVar: "BMP_BASE_CONFIG",
					Value:  "/boomfunc/app/router.yml",
				},
				cli.StringFlag{
					Name:   "app",
					Usage:  appFlagUsage,
					EnvVar: "BMP_BASE_APP_LAYER",
					Value:  "http",
				},
			},
			Subcommands: []cli.Command{
				{
					Name:   "tcp",
					Usage:  runTCPCommandUsage,
					Action: runCommandAction,
				},
				{
					Name:   "udp",
					Usage:  runUDPCommandUsage,
					Action: runCommandAction,
				},
				{
					Name: "golang",
					// Usage:  runGolangCommandUsage,
					Action: runGolangCommandAction,
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
