package server

import (
	"errors"
	"net"
	"runtime"

	"github.com/boomfunc/root/base/server/mux"
	"github.com/boomfunc/root/base/server/transport"
	"github.com/boomfunc/root/tools/flow"
	"github.com/google/uuid"
)

var (
	ErrWrongFlow          = errors.New("base/server: Unexpected flow type received from transport")
	ErrWrongContext       = errors.New("base/server: Context without required key")
	ErrUnknownApplication = errors.New("base/server: Unknown server application")
	ErrUnknownTransport   = errors.New("base/server: Unknown server transport")
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
	var application flow.SStep
	switch applicationName {
	case "http":
		application = flow.Func2(m.HTTP)
	case "json":
		application = flow.Func2(m.JSON)
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

	// Phase 4. Create server
	srv := &Server{
		uuid:        uuid.New(),
		workers:     runtime.NumCPU(),
		transport:   tr,
		application: application,
	}

	return srv, nil
}
