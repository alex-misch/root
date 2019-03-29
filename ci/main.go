package main

import (
	"context"
	"encoding/json"
	"io"

	"github.com/boomfunc/root/ci/cli"
	"github.com/boomfunc/root/ci/session"
	"github.com/boomfunc/root/tools/flow"
	"github.com/google/uuid"
)

var (
	NODE      string // name of the node for which the CLI interface is started
	VERSION   string // a version of the node (compile-time variable)
	TIMESTAMP string // when the node was built (compile-time variable)
)

func main() {
	cli.Run(NODE, VERSION, TIMESTAMP)
}

func SessionRun(ctx context.Context) error {
	stdout, ok := ctx.Value("stdout").(io.Writer)
	if !ok {
		return flow.ErrStepOrphan
	}

	// create new session
	session, err := session.New(uuid.Nil, "https://github.com/agurinov/root.git", "refs/heads/master")
	if err != nil {
		return err
	}

	return flow.Delay(
		10, // workers queue (now it is hardcode)

		// immediately step is just print information about session
		// now we using json representation (look at session.MarshalJSON() method)
		flow.Func(func(ctx context.Context) error {
			// write session data as json to stdout
			return json.NewEncoder(stdout).Encode(session)
		}),

		// behind the scenes delay step will be `session` itself
		// NOTE: because `session` implements `flow.Step` interface
		session,
	).Run(ctx)
}
