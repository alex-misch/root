package pipeline

import (
	"context"
	"io"

	"github.com/boomfunc/root/tools/flow"
)

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

func executeStep(obj Exec) flow.Step {
	return flow.Func(func(ctx context.Context) error {
		if err := obj.run(ctx); err != nil {
			obj.close(ctx)
			return err
		}
		return obj.close(ctx)
	})
}

func prepareStep(obj Exec) flow.Step {
	return flow.Func(func(ctx context.Context) error {
		if err := obj.prepare(ctx); err != nil {
			return err
		}
		return obj.check(ctx)
	})
}

// run is special shortcut for running pipeline.Exec
func run(ctx context.Context, objs ...Exec) error {
	// Phase 1. PREPARE AND CHECK
	// in case of error it will be rolled back to initial incoming state
	prepareUp := make([]flow.Step, len(objs))
	prepareDown := make([]flow.Step, len(objs))
	executeUp := make([]flow.Step, len(objs))

	for i, obj := range objs {
		prepareUp[i] = prepareStep(obj)
		executeUp[i] = executeStep(obj)
		prepareDown[i] = flow.Func(obj.close)
	}

	return flow.Group(
		// First step, prepare all layers (prepare, down otherwise)
		flow.Transaction(
			flow.Concurrent(prepareUp...),
			flow.Concurrent(prepareDown...),
			false,
		),
		// Second step, execute all layers (execute, down anyway)
		flow.Transaction(
			flow.Concurrent(executeUp...),
			flow.Concurrent(prepareDown...),
			true,
		),
	).Run(ctx)
}
