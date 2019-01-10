package server

import (
	"container/heap"

	"github.com/boomfunc/root/base/server/application"
	"github.com/boomfunc/root/base/server/context"
	"github.com/boomfunc/root/base/server/dispatcher"
	"github.com/boomfunc/root/base/server/flow"
	"github.com/boomfunc/root/base/server/transport"
	"github.com/boomfunc/root/base/tools"
	"github.com/boomfunc/root/tools/chronometer"
	"github.com/google/uuid"
)

type Server struct {
	node uuid.UUID

	transport  transport.Interface
	app        application.Interface
	dispatcher *dispatcher.Dispatcher

	errCh    chan error
	outputCh chan *flow.Data
}

func (srv *Server) engine() {
	for {
		// Phase 1. get worker
		// try to fetch empty worker
		// blocking mode!
		node := chronometer.NewNode()
		worker := srv.dispatcher.OccupyWorker()
		node.Exit()

		// Phase 2. Obtain socket with data from heap/poller
		// blocking mode!
		if flow, ok := heap.Pop(srv.transport).(*flow.Data); ok {
			flow.Chronometer.Exit("transport")
			flow.Chronometer.AddNode("dispatcher", node)
			context.SetMeta(flow.Ctx, "srv", srv)
			// send to worker's channel
			// blocking send operation!
			// TODO be careful -> blocking operation if worker not listening channel
			// TODO because unbuffered and no receiver
			worker.TaskChannel <- Task{flow}
		} else {
			// something wrong received
			// we don't know how to work with this
			// TODO same shit as earlier
			srv.errCh <- ErrWrongFlow
		}

		// Phase 3. Return worker to dispatcher in any way
		srv.dispatcher.AttachWorker(worker)
	}
}

// this function listen all server channels
// TODO listen OS signals and gracefully close server
// check for errors additionally -> errors to log
// response.Stat to log
func (srv *Server) listen() {
	for {
		select {
		case err := <-srv.errCh:
			if err != nil {
				tools.ErrorLog(err)
			}

		case flow := <-srv.outputCh:
			// ready response from dispatcher system
			// log ANY kind of result
			AccessLog(flow)
			// and errors
			if err := flow.Stat.Error; err != nil {
				// TODO think about it
				// TODO https://play.golang.org/p/dNV2qI90EKQ
				// TODO https://blog.quickmediasolutions.com/2015/09/13/non-blocking-channels-in-go.html
				go func() {
					srv.errCh <- err
				}()
			}
		}
	}
}

func (srv *Server) Serve() {
	// TODO unreachable https://stackoverflow.com/questions/11268943/is-it-possible-to-capture-a-ctrlc-signal-and-run-a-cleanup-function-in-a-defe
	// TODO defer ch.Close()
	// TODO defer s.conn.Close()
	// TODO unreachable https://stackoverflow.com/questions/11268943/is-it-possible-to-capture-a-ctrlc-signal-and-run-a-cleanup-function-in-a-defe
	// TODO https://rcrowley.org/articles/golang-graceful-stop.html

	// create real worker instances
	srv.dispatcher.Prepare()

	// GOROUTINE 2 (listen server channels)
	go srv.listen()

	// GOROUTINE 3 (main engine)
	// bridge between worker(from dispatcher) and task(from heap)
	go srv.engine()

	// Here we can test some of our system requirements and performance recommendations
	PerformanceLog(srv.dispatcher.MaxWorkers)

	// GOROUTINE 1 (main) - this goroutine
	// This is thread blocking procedure - infinity loop
	srv.transport.Serve()
}
