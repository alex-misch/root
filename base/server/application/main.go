package application

import (
	"context"
	"errors"
	"io"

	"github.com/boomfunc/root/base/conf"
	"github.com/boomfunc/root/base/server/flow"
	executor "github.com/boomfunc/root/tools/flow"
)

var (
	ErrBadRequest  = errors.New("server/application: Bad request")
	ErrServerError = errors.New("server/application: Internal error")
	ErrNotFound    = errors.New("server/application: Route not found")
)

type Interface interface {
	Handle(*flow.Data)
}

type Packer interface {
	Unpack(context.Context, io.Reader) (*flow.Request, error)
	Pack(io.Reader, io.Writer) (int64, error)
}

type Application struct {
	router *conf.Router
	packer Packer
}

func (app *Application) Handle(fl *flow.Data) {
	var req *flow.Request
	var err error
	var written int64

	defer func() {
		fl.Stat.Request = req
		fl.Stat.Error = err
		fl.Stat.Len = written
	}()

	// Parse request
	// fill context meta part and q part
	// TODO ErrBadRequest
	req, err = app.packer.Unpack(fl.Ctx, fl.RWC)
	if err != nil {
		return
	}

	// Resolve view
	// TODO conf.ErrRouteNotFound
	// fill context url
	route, err := app.router.Match(req.Url)
	if err != nil {
		return
	}

	// Run pipeline (under app layer)
	pr, pw := io.Pipe()
	// we will run view through executor
	err = executor.Concurrent(
		executor.Func(func(ctx context.Context) error {
			return route.Run(ctx, req.Input, pw) // TODO: hungs here
		}),
		executor.Func(func(ctx context.Context) error {
			_, err := app.packer.Pack(pr, fl.RWC)
			return err
		}),
	).Run(fl.Ctx) // TODO: hungs here

	return
}
