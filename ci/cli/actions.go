package cli

import (
	"github.com/boomfunc/root/base/tools"
	"github.com/boomfunc/root/ci/session"
	"github.com/boomfunc/root/ci/step"
	"github.com/boomfunc/root/tools/log"
	"github.com/urfave/cli"
)

var (
	// Actions
	sessionCommandUsage    = "Do something with session. Choose subcommand"
	runSessionCommandUsage = "Run CI session"
	// Flags
	debugFlagUsage  = "Debugging mode"
	originFlagUsage = "URL to origin git repository"
	refFlagUsage    = "GIT ref"
)

func runCommandAction(c *cli.Context) {
	log.SetDebug(c.GlobalBool("debug"))

	StartupLog("ci", c.App.Version, c.App.Compiled)

	// Extract params
	origin := c.GlobalString("origin")
	ref := c.GlobalString("ref")

	log.Debugf("ORIGIN: %s, REF: %s", origin, ref)

	// Create and run session
	session, err := session.New(origin)
	if err != nil {
		tools.FatalLog(err)
	}

	// logging
	log.Debugf("Session `%s` is runnning", session.UUID)
	if err := step.Run(session); err != nil {
		tools.FatalLog(err)
	}
	log.Debugf("Session `%s` successful", session.UUID)
}
