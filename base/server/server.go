package server

import (
	"container/heap"
	"context"

	"github.com/boomfunc/root/base/server/transport"
	"github.com/boomfunc/root/tools/flow"
	"github.com/google/uuid"
)

type Server struct {
	// common instance variables
	uuid    uuid.UUID
	workers int

	// transport layer variables
	transport transport.Interface

	// application layer variables
	application flow.SStep
}

func (srv *Server) steps() heap.Interface {
	return &steps{
		h:          srv.transport,
		entrypoint: srv.application,
	}
}

func (srv *Server) Serve() error {
	// TODO unreachable https://stackoverflow.com/questions/11268943/is-it-possible-to-capture-a-ctrlc-signal-and-run-a-cleanup-function-in-a-defe
	// TODO defer ch.Close()
	// TODO defer s.conn.Close()
	// TODO unreachable https://stackoverflow.com/questions/11268943/is-it-possible-to-capture-a-ctrlc-signal-and-run-a-cleanup-function-in-a-defe
	// TODO https://rcrowley.org/articles/golang-graceful-stop.html

	// GOROUTINE 2 (listen server channels)
	// go srv.listen()

	// GOROUTINE 3 (main engine)
	// bridge between worker(from dispatcher) and task(from heap)
	// go srv.engine()

	// Here we can test some of our system requirements and performance recommendations
	// TODO: deprecated calculations, refactor
	// PerformanceLog(cap(srv.dispatcher))

	go srv.transport.Serve()

	return flow.ConcurrentHeap(
		flow.WorkersHeap(4), // number of workers (based on CPU)
		srv.steps(),
	).Run(context.Background())
}
