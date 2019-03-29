package cli

import (
	"github.com/boomfunc/root/base/tools"
	"github.com/boomfunc/root/ci/session"
	tcli "github.com/boomfunc/root/tools/cli"
	"github.com/boomfunc/root/tools/flow"
	"github.com/boomfunc/root/tools/log"
	"github.com/google/uuid"
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

	// TODO: via c.App.Name
	// https://github.com/urfave/cli/issues/783
	tcli.StartupLog("ci", c.App.Version, c.App.Compiled)

	// Extract params
	origin := c.GlobalString("origin")
	ref := c.GlobalString("ref")
	log.Debugf("Repo origin: %s, reference: %s", origin, ref)

	// Create session (clone repo)
	session, err := session.New(uuid.Nil, origin, ref)
	if err != nil {
		tools.FatalLog(err)
	}

	// run session
	log.Debugf("Session `%s` is runnning", session.UUID)
	if err := flow.Execute(session); err != nil {
		tools.FatalLog(err)
	}
	log.Debugf("Session `%s` successful", session.UUID)
}
