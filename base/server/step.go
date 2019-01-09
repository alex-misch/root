package server

// import (
// 	"context"
//
// 	"github.com/boomfunc/root/tools/router"
// 	"github.com/boomfunc/root/tools/flow"
// )
//
// var view flow.Step = flow.Dispatcher(
// 	2, // os.cpu for example
// 	flow.Group(
//
// 		// NOTE: this block is about parsing incoming stream
// 		// ErrBadRequest or ErrRouteNotFound might be thrown
// 		flow.Func(func(ctx context.Context) error {
// 			unpacker, ok := ctx.Value("base.unpacker").(application.Unpacker)
// 			if !ok {
// 				return flow.ErrStepOrphan
// 			}
//
// 			return unpacker.Unpack(ctx)
// 		}),
// 		flow.Func(func(ctx context.Context) error {
// 			// fetch url
// 			url, ok := ctx.Value("base.request.url").(string)
// 			if !ok {
// 				return flow.ErrStepOrphan
// 			}
//
// 			// fetch router from context - otherwise orphan
// 			router, ok := ctx.Value("base.router").(router.Router)
// 			if !ok {
// 				return flow.ErrStepOrphan
// 			}
//
// 			// router match
// 			route, err := router.Match(url)
// 			if err != nil {
// 				return err
// 			}
//
// 			// save pipeline to ctx (as view)
// 			// TODO: save params to ctx
// 			ctx = context.WithValue()
// 			return nil
// 		}),
//
// 		// NOTE: this block is about pipeline logic and concrete view per route
// 		// ErrServerError only might be thrown
// 		flow.Concurrent( // NOTE: concurrent with waiting (one part reads and process, another write answer)
// 			flow.Func(func(ctx context.Context) error {
// 				// pipeline run
// 				// NOTE: fetch pipeline, input and output from context - otherwise orphan
// 				// TODO: return pipeline.Run(ctx, req.Input, pw)
// 				return nil
// 			}),
// 			flow.Func(func(ctx context.Context) error {
// 				// app pack request
// 				// NOTE: fetch input and output from context - otherwise orphan
// 				// NOTE: app fetch from context - otherwise orphan
// 				// TODO: return app.packer.Pack(pr, fl.RWC)
// 				return nil
// 			}),
// 		),
//
// 		// NOTE: this block is about debugging and logging
// 		// NOTE this step might be omitted if error (but it's no good)
// 		flow.Func(func(ctx context.Context) error {
// 			// access log and error log
// 			return nil
// 		}),
// 	),
// )
