package server

import (
	"errors"

	"github.com/boomfunc/root/base/server/context"
	"github.com/boomfunc/root/base/server/flow"
	"github.com/boomfunc/root/base/tools"
)

type Task struct {
	flow *flow.Data
}

// Solve implements dispatcher.Task interface
// this function will be passed to dispatcher system
// and will be run at parallel
func (task Task) Solve() {
	srvInterface, err := context.GetMeta(task.flow.Ctx, "srv")
	if err != nil {
		tools.FatalLog(err)
	}

	srv, ok := srvInterface.(*Server)
	if !ok {
		tools.FatalLog(ErrWrongContext)
	}

	// unexpected errors resolving
	defer func() {
		if r := recover(); r != nil {
			switch typed := r.(type) {
			case error:
				srv.errCh <- typed
			case string:
				srv.errCh <- errors.New(typed)
			}
		}
	}()

	// solve server task and measure time
	task.flow.Chronometer.Enter("app")
	srv.app.Handle(task.flow) // TODO hungs here
	task.flow.Chronometer.Exit("app")

	// task solved, data is written, socket can be closed
	task.flow.RWC.Close()

	// log results
	srv.outputCh <- task.flow
}
