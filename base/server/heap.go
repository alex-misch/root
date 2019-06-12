package server

import (
	"container/heap"
	"context"
	"io"
	"net"
	"os"
	"syscall"

	"github.com/boomfunc/root/tools/flow"
	"github.com/boomfunc/root/tools/log"
)

func close(ctx context.Context, stdin io.Reader, stdout, stderr io.Writer) error {
	c, ok := stdin.(*net.TCPConn)
	if !ok {
		return nil
	}

	defer c.Close()

	f, err := c.File()
	if err != nil {
		return err
	}

	return syscall.Shutdown(int(f.Fd()), syscall.SHUT_RDWR)
}

type steps struct {
	inner      heap.Interface
	entrypoint flow.SStep
}

func (ss *steps) Len() int {
	return ss.inner.Len()
}

func (ss *steps) Less(i, j int) bool {
	return ss.inner.Less(i, j)
}

func (ss *steps) Swap(i, j int) {
	ss.inner.Swap(i, j)
}

func (ss *steps) Push(x interface{}) {}

func (ss *steps) Pop() interface{} {
	for {
		if conn, ok := heap.Pop(ss.inner).(io.ReadWriteCloser); ok {

			iteration := NewIteration()
			stdout := log.New(os.Stdout, log.InfoPrefix)
			stderr := log.New(os.Stderr, log.ErrorPrefix)

			return flow.Transaction(

				// Up action - run application layer.
				flow.Func(func(ctx context.Context) error {

					iteration.Chronometer.Enter("app")
					defer iteration.Chronometer.Exit("app")

					iteration.Error = ss.entrypoint.Run(ctx, conn, conn, nil)
					return iteration.Error

				}),

				flow.Group(nil,
					// Rollback action - close connection
					flow.Func(func(ctx context.Context) error {
						flow.Func2(close).Run(ctx, conn, conn, nil)
						return nil
					}),
					// And log results.
					flow.Func(func(ctx context.Context) error {
						iteration.Log(stdout)
						if iteration.Error != nil {
							iteration.Log(stderr)
						}
						return nil
					}),
				),

				true, // do rollback anyway
			)

		}
	}
}
