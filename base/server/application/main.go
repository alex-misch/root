package application

import (
	"context"
	"errors"
	"io"

	"github.com/boomfunc/root/base/conf"
	srvctx "github.com/boomfunc/root/base/server/context"
	"github.com/boomfunc/root/base/server/flow"
	executor "github.com/boomfunc/root/tools/flow"
	"github.com/boomfunc/root/tools/kvs"
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
	Pack(context.Context, io.Reader, io.Writer) error
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

	// TODO: not here, but for now - good
	ctx := context.WithValue(fl.Ctx, "db", kvs.New())
	// TODO

	// Parse request
	// fill context meta part and q part
	// TODO ErrBadRequest
	req, err = app.packer.Unpack(ctx, fl.RWC)
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

	// Get url query and save to context
	values, err := srvctx.Values(ctx)
	if err != nil {
		return
	}
	values.Url, err = route.MatchParams(req.Url.RequestURI())
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
			return app.packer.Pack(ctx, pr, fl.RWC)
		}),
	).Run(ctx) // TODO: hungs here

	return
}
