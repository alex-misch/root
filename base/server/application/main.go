package application

import (
	"context"
	"errors"
	"io"
	"strings"

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
	db := kvs.New("http")
	ctx := context.WithValue(fl.Ctx, "db", db)
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

	// TODO OH my god
	// TODO: bad, very bad
	if strings.HasPrefix(req.Url.RequestURI(), "/ssr") {
		// workaround: set waiting for status
		db.Set("http", "wait", true)
	}
	// TODO: bad, very bad
	// TODO OH my god

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
	// NOTE: if we suddenly want to run through flow.Group - with pipe this idea will fail
	// because pw without reader will hang
	err = executor.Concurrent(

		// First part is writing to pipe `pipeline`'s output
		executor.Func(func(ctx context.Context) error {
			return route.Run(ctx, req.Input, pw)
		}),

		// Another part is reading chunks from pipe and writes to response
		executor.Func(func(ctx context.Context) error {
			return app.packer.Pack(ctx, pr, fl.RWC)
		}),
	).Run(ctx)

	return
}
