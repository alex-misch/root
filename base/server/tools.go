package server

import (
	"errors"
	"net"

	"github.com/boomfunc/root/base/server/dispatcher"
	"github.com/boomfunc/root/base/server/flow"
	"github.com/boomfunc/root/base/server/mux"
	"github.com/boomfunc/root/base/server/transport"
	"github.com/google/uuid"
)

var (
	ErrWrongFlow          = errors.New("server: Unexpected flow type received from transport")
	ErrWrongContext       = errors.New("server: Context without required key")
	ErrUnknownApplication = errors.New("server: Unknown server application")
	ErrUnknownTransport   = errors.New("server: Unknown server transport")
)

func New(transportName string, applicationName string, workers int, ip net.IP, port int, config string) (*Server, error) {
	// Phase 1. Prepare light application layer things
	// TODO switch detect type
	// router, err := conf.LoadExternalFile(config)
	m, err := mux.FromFile(config)
	if err != nil {
		// cannot load server config
		return nil, err
	}

	// Phase 2. Prepare application layer
	var step mux.Entrypoint
	switch applicationName {
	case "http":
		step = m.HTTP
	case "json":
		step = m.JSON
	default:
		return nil, ErrUnknownApplication
	}

	// Phase 3. Prepare transport layer
	var tr transport.Interface
	switch transportName {
	case "tcp":
		tr, err = transport.TCP(ip, port)
		if err != nil {
			return nil, err
		}
	default:
		return nil, ErrUnknownTransport
	}

	// Phase 4. transport layer recognized, we can create support data for connection layers
	errCh := make(chan error)
	outputCh := make(chan *flow.Data)
	tr.Connect(errCh)

	// Phase 5. Create server
	srv := new(Server)
	srv.node = uuid.New()
	// flow data
	srv.transport = tr
	srv.step = step
	srv.dispatcher = dispatcher.New(workers)
	// channels and data storages
	srv.errCh = errCh
	srv.outputCh = outputCh

	return srv, nil
}
