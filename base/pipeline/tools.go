package pipeline

import (
	"context"
	"io"

	"github.com/boomfunc/root/base/tools"
	"github.com/boomfunc/root/tools/flow"
)

// CmdSplitRender return rendered parts for process argv
func CmdSplitRender(ctx context.Context, cmd string) []string {
	parts := tools.CLISplit(cmd)

	for i, part := range parts {
		parts[i] = tools.StringFromCtx(ctx, part)
	}

	return parts
}

// piping establishes pipe connections between IO processes (Able)
// the first obj accepts as stdin the input buffer
// the last obj puts into output buffer his stdout
func piping(input io.ReadCloser, output io.WriteCloser, objs ...Able) error {
	// main logic that create pairs of (io.ReadCloser, io.WriteCloser)
	// but with offset to another obj
	// for example
	// obj 1: (input, io.WriteCloser 1)
	// obj 2: (io.ReadCloser 1, io.WriteCloser 2)
	// obj 3: (io.ReadCloser 2, io.WriteCloser 3)
	// obj 4: (io.ReadCloser 3, output)
	for i := 0; i < len(objs); i++ {
		if i == 0 {
			// case this obj first
			objs[i].setStdin(input)
		}
		if i == len(objs)-1 {
			// case this obj last
			objs[i].setStdout(output)
		} else {
			// this is intermediate obj, need piping
			r, w := io.Pipe()
			objs[i].setStdout(w)
			objs[i+1].setStdin(r)
		}
	}

	return nil
}

// run is special shortcut for running pipeline.Execs
// there is two steps: first is to prepare and check all layers
// and second is run them
func run(ctx context.Context, objs ...Exec) error {
	// Phase 1. PREPARE AND CHECK
	// in case of error it will be rolled back to initial incoming state
	prerun := make([]flow.Step, len(objs))
	run := make([]flow.Step, len(objs))
	close := make([]flow.Step, len(objs))

	for i, obj := range objs {
		// prerun is a group of two operations step by step - `prepare` and `check`
		prerun[i] = flow.Group(flow.Func(obj.prepare), flow.Func(obj.check))
		// run is a transaction with mandatory rollback (`run` is up and `close` is down)
		run[i] = flow.Transaction(flow.Func(obj.run), flow.Func(obj.close), true)
		// close is a just func `close` from interface
		close[i] = flow.Func(obj.close)
	}

	return flow.Group(
		// First step, prepare all layers (prepare, down only if error occured)
		flow.Transaction(flow.Concurrent(prerun...), flow.Concurrent(close...), false),
		// Second step, execute all layers concurrently (run, close anyway)
		flow.Concurrent(run...),
	).Run(ctx)
}
