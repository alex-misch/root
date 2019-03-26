package main

import (
	"context"
	"fmt"
	"github.com/boomfunc/root/ci/session"
	"io"

	"github.com/boomfunc/root/ci/cli"
	"github.com/boomfunc/root/tools/flow"
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
	session, err := session.New("https://github.com/agurinov/root", "refs/heads/ci")
	if err != nil {
		return err
	}

	return flow.Delay(
		10,

		flow.Func(func(ctx context.Context) error {
			// write to stdout their UUID
			if _, err := fmt.Fprint(stdout, session.UUID); err != nil {
				return err
			}
			return nil
		}),

		session, // NOTE: because `sess` implements `flow.Step` interface
	).Run(ctx)
}
