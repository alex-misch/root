package server

import (
	"context"

	"github.com/boomfunc/root/tools/flow"
)

var view = flow.Dispatcher(
	2, // os.cpu for example
	flow.Group(

		// NOTE: this block is about parsing incoming stream
		// ErrBadRequest or ErrRouteNotFound might be thrown
		flow.Func(func(ctx context.Context) error {
			// app unpack request
			// NOTE: app fetch from context - otherwise orphan
			// NOTE: write request to context
			// TODO: return app.packer.Unpack(fl.Ctx, fl.RWC)
			return nil
		}),
		flow.Func(func(ctx context.Context) error {
			// router match
			// TODO: separate router and application
			// NOTE: router fetch from context - otherwise orphan
			// TODO: router.Match(req.Url)
			// TODO: save pipeline to ctx
			return nil
		}),

		// NOTE: this block is about pipeline logic and concrete view per route
		// ErrServerError only might be thrown
		flow.Concurrent( // NOTE: concurrent with waiting (one part reads and process, another write answer)
			flow.Func(func(ctx context.Context) error {
				// pipeline run
				// NOTE: fetch pipeline, input and output from context - otherwise orphan
				// TODO: return pipeline.Run(ctx, req.Input, pw)
				return nil
			}),
			flow.Func(func(ctx context.Context) error {
				// app pack request
				// NOTE: fetch input and output from context - otherwise orphan
				// NOTE: app fetch from context - otherwise orphan
				// TODO: return app.packer.Pack(pr, fl.RWC)
				return nil
			}),
		),

		// NOTE: this block is about debugging and logging
		// NOTE this step might be omitted if error (but it's no good)
		flow.Func(func(ctx context.Context) error {
			// access log and error log
			return nil
		}),
	),
)
