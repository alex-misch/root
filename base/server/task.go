package server

import (
	"errors"
	"net"
	"syscall"

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
	// socket should be closed in any way
	// defer task.flow.RWC.Close()
	defer func() {
		c, ok := task.flow.RWC.(*net.TCPConn)
		if !ok {
			return
		}

		f, err := c.File()
		if err != nil {
			return
		}

		if err := syscall.Shutdown(int(f.Fd()), syscall.SHUT_RDWR); err == nil {
			task.flow.RWC.Close()
		}
	}()

	// we need some context from global env to know how to solve this task
	srvInterface, err := context.GetMeta(task.flow.Ctx, "srv")
	if err != nil {
		tools.ErrorLog(err)
		return
	}

	srv, ok := srvInterface.(*Server)
	if !ok {
		tools.ErrorLog(ErrWrongContext)
		return
	}

	// here we have server pointer and can work with app
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

	// log results
	srv.outputCh <- task.flow
}
