package server

import (
	"container/heap"
	"context"
	"io"
	"net"
	"os"
	"syscall"

	"github.com/boomfunc/root/tools/flow"
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
	h          heap.Interface
	entrypoint flow.SStep
}

func (ss *steps) Len() int {
	return ss.h.Len()
}

func (ss *steps) Less(i, j int) bool {
	return ss.h.Less(i, j)
}

func (ss *steps) Swap(i, j int) {
	ss.h.Swap(i, j)
}

func (ss *steps) Push(x interface{}) {
	heap.Push(ss.h, x)
}

func (ss *steps) Pop() interface{} {
	for {
		if conn, ok := heap.Pop(ss.h).(io.ReadWriteCloser); ok {

			iteration := NewIteration()
			iteration.Chronometer.Enter("app")

			return flow.Transaction(

				// up movement - run application layer
				flow.Func(func(ctx context.Context) error {
					defer iteration.Chronometer.Exit("app")
					return ss.entrypoint.Run(ctx, conn, conn, nil)
				}),

				// Rollback action.
				flow.Group(nil,
					// close connection
					flow.Func(func(ctx context.Context) error {
						return flow.Func2(close).Run(ctx, conn, conn, nil)
					}),
					// log
					flow.Func(func(ctx context.Context) error {
						return iteration.Info(os.Stdout)
					}),
				),

				true, // do rollback anyway
			)

		}
	}
}
