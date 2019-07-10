package server

import (
	"container/heap"
	"context"
	"fmt"
	"io"
	"os"

	"github.com/boomfunc/root/base/tools/poller"
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

		// Fetch polled item.
		// NOTE: This type assertion is a part of the WORKAROUND for poll timing below.
		if item, ok := heap.Pop(ss.inner).(*poller.HeapItem); ok {

			conn, ok := item.Value.(io.ReadWriteCloser)
			if !ok {
				continue
			}
			// End of the workaround.

			// Initial variables prepare.
			conn = &Conn{rwc: conn}     // Wrap raw connection.
			iteration := NewIteration() // Create metadata about this request.

			// Workaround for calculating chronometer `poll` node.
			iteration.Chronometer.EnterWithTime("poll", item.Time) // The time when an object was added to the poller.
			iteration.Chronometer.Exit("poll")
			// End of the workaround.

			// From this place and before the start of the `Step`, the `Step` can get into waiting for the worker.
			// Let's mesure this.
			iteration.Chronometer.Enter("dispatcher")

			// Return the step for the dispatcher.
			return flow.Transaction(

				// Up action - run application layer.
				flow.Func(func(ctx context.Context) error {
					iteration.Chronometer.Exit("dispatcher")

					// Good place to catch unexpected errors (panics).
					// If there exists - means it is low-level error => Override error from application.
					defer func() {
						if r := recover(); r != nil {
							// Something of type interface{} was raised. Generate common message.
							// NOTE: `error` type has default format %s
							iteration.Error = fmt.Errorf("base/server: Unexpected error: %v", r)
						}
					}()

					// Workaround for fetching url from entrypoint in iteration log.
					url := new(string)
					defer func() { iteration.url = *url }()
					ctx = context.WithValue(ctx, "base.request.url", url)
					// End of the workaround.

					// Run entrypoint with time measuring.
					iteration.Chronometer.Enter("app")
					defer iteration.Chronometer.Exit("app")

					iteration.Error = ss.entrypoint.Run(ctx, conn, conn, nil)
					return iteration.Error

				}),

				// Down action - log results and close connection.
				flow.Concurrent(nil,
					flow.Func(func(ctx context.Context) error { return conn.Close() }),

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
