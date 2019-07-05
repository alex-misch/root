package server

import (
	"container/heap"
	"context"
	"fmt"
	"io"
	"os"

	"github.com/boomfunc/root/tools/flow"
	"github.com/boomfunc/root/tools/log"
)

var (
	// stdout := log.New(os.Stdout, log.InfoPrefix)
	// stderr := log.New(os.Stderr, log.ErrorPrefix)
	stdout = log.New(os.Stdout, "")
	stderr = log.New(os.Stderr, "")
)

// StepsHeap implements heap.Interface which returns flow.Step.
type StepsHeap struct {
	inner      heap.Interface
	entrypoint flow.SStep
}

func (ss *StepsHeap) Len() int           { return ss.inner.Len() }      // Just a proxy method.
func (ss *StepsHeap) Less(i, j int) bool { return ss.inner.Less(i, j) } // Just a proxy method.
func (ss *StepsHeap) Swap(i, j int)      { ss.inner.Swap(i, j) }        // Just a proxy method.
func (ss *StepsHeap) Push(x interface{}) { heap.Push(ss.inner, x) }     // Just a proxy method.

func (ss *StepsHeap) Pop() interface{} {
	for {
		if conn, ok := heap.Pop(ss.inner).(io.ReadWriteCloser); ok {

			// Wrap raw connection.
			conn = &Conn{rwc: conn}

			iteration := NewIteration()

			return flow.Transaction(

				// Up action - run application layer.
				flow.Func(func(ctx context.Context) error {

					// Good place to catch unexpected errors (panics).
					// If there exists - means it is low-level error.
					// Override error from application.
					defer func() {
						if r := recover(); r != nil {
							switch typed := r.(type) {
							case error:
								iteration.Error = typed
							case string:
								iteration.Error = fmt.Errorf("base/server: %s", typed)
							}
						}
					}()

					// Workaround for fetching url from entrypoint in iteration log.
					url := new(string)
					defer func() { iteration.url = *url }()
					ctx = context.WithValue(ctx, "base.request.url", url)
					// End of the workaround.

					// Run entrypoint with measuring.
					iteration.Chronometer.Enter("app")
					defer iteration.Chronometer.Exit("app")

					iteration.Error = ss.entrypoint.Run(ctx, conn, conn, nil)
					return iteration.Error

				}),

				// Rollback action - log results and close connection.
				flow.Concurrent(nil,
					flow.Func(func(ctx context.Context) error {
						return conn.Close()
					}),

					flow.Func(func(ctx context.Context) error {
						iteration.AccessLog(stdout, JSON)
						if iteration.Error != nil {
							iteration.ErrorLog(stderr, JSON)
						}
						return nil
					}),
				),

				true, // do rollback anyway
			)

		}
	}
}
