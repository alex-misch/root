package server

import (
	"container/heap"
	// "os"

	"github.com/boomfunc/root/base/server/transport"
	"github.com/boomfunc/root/tools/flow"
	// "github.com/boomfunc/root/tools/log"
	"github.com/google/uuid"
)

type Server struct {
	// Common server variables.
	uuid    uuid.UUID
	workers int

	// Transport layer variables.
	transport transport.Interface

	// Application layer variables.
	application flow.SStep
}

func (srv *Server) steps() heap.Interface {
	return &steps{
		inner:      srv.transport,
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

	// stderr := log.New(os.Stderr, log.ErrorPrefix)
	// stderr.Write([]byte("OOOPS"))

	return flow.NewGroup(
		flow.WorkersHeap(srv.workers), // Number of workers (based on CPU).
		srv.steps(),                   // Steps from transport layer. Infinity heap mode.
		// Own goroutine per request.
		// Each request uses his own context
		flow.R_CONCURRENT|flow.CTX_STEP_NEW,
	).Run(nil)
}
