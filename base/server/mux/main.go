package mux

import (
	"bufio"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/boomfunc/root/base/pipeline"
	"github.com/boomfunc/root/base/tools"
	"github.com/boomfunc/root/tools/kvs"
	"github.com/boomfunc/root/tools/router"
)

// fillCtx is the isolated ugly workaround for application layer.
// Fill to context three namespaces for future bindings.
//
// q - from query string
// meta - from server connection
// url - from regexp match
//
// In future - look for a better solution.
func fillCtx(ctx context.Context, match *router.Route, rwc interface{}, r *http.Request) context.Context {
	ctx = kvs.NewWithContext(ctx, "q", "url", "meta")

	// Fill `q` namespace.
	q := match.Url.Query()
	for k, _ := range q {
		kvs.SetWithContext(ctx, "q", k, q.Get(k))
	}

	// Fill `url` namespace.
	for k, v := range match.Params() {
		kvs.SetWithContext(ctx, "url", k, v)
	}

	// Fill `meta` namespace
	if r != nil {
		// HTTP mode
		kvs.SetWithContext(ctx, "meta", "ip", tools.GetRemoteIP(
			tools.GetRemoteAddr(rwc),
			r.Header.Get("X-Forwarded-For"), r.Header.Get("X-Real-IP"),
		))
		kvs.SetWithContext(ctx, "meta", "ua", r.UserAgent())
		kvs.SetWithContext(ctx, "meta", "host", r.Host)
	} else {
		// Plain TCP mode.
		kvs.SetWithContext(ctx, "meta", "ip", tools.GetRemoteIP(
			tools.GetRemoteAddr(rwc),
		))
	}

	return ctx
}

// Router is type wrapper
// Contains several application handlers.
type Router router.Mux

// UnmarshalYAML implements the yaml.Unmarshaller interface
func (r *Router) UnmarshalYAML(unmarshal func(interface{}) error) error {
	// inner struct for accepting strings
	var routes []struct {
		Pattern  string
		Pipeline pipeline.Pipeline
	}

	if err := unmarshal(&routes); err != nil {
		return err
	}

	// yaml valid, transform it
	for _, route := range routes {
		*r = append(
			*r,
			*router.NewRoute(route.Pattern, route.Pipeline),
		)
	}

	return nil
}

// JSON is the raw data handler entrypoint
// Parse incoming data as json payload
// Return data as raw
func (mux Router) JSON(ctx context.Context, stdin io.Reader, stdout, stderr io.Writer) error {
	// Phase 1. Parse payload as raw JSON.
	intermediate := struct {
		Url   string
		Stdin string
	}{}
	if err := json.NewDecoder(stdin).Decode(&intermediate); err != nil {
		return err
	}

	// Part of the workaround with url for iteration.
	// Look at heap.go
	if url, ok := ctx.Value("base.request.url").(*string); ok {
		*url = intermediate.Url
	}

	u, err := url.Parse(intermediate.Url)
	if err != nil {
		return err
	}

	// Phase 2. Run view (`Step` interface) fetched from router.
	step := router.Mux(mux).MatchLax(u)
	if step != nil {
		// Middlephase. Fill context only if something matched.
		ctx = fillCtx(ctx, step, stdin, nil)
	}

	return step.Run(ctx, strings.NewReader(intermediate.Stdin), stdout, stderr)
}

// HTTP is the http logic handler entrypoint.
// Parse request as http payload.
// Run http handler.
// Pack response as http.
func (mux Router) HTTP(ctx context.Context, stdin io.Reader, stdout, stderr io.Writer) error {
	// Phase 1. Parse payload as http request.
	r, err := http.ReadRequest(bufio.NewReader(stdin))
	if err != nil {
		return err
	}

	// Part of the workaround with url for iteration.
	// Look at heap.go
	if url, ok := ctx.Value("base.request.url").(*string); ok {
		*url = r.URL.RequestURI()
	}

	// Phase 2. Run http.Handler
	// 1. Create response writer
	// 2. Tranform request to use our cancellation context.
	// 3. Run via StepHandler. Note that error from http.Handler not visible here, we will use the channel to return this.
	step := router.Mux(mux).MatchLax(r.URL)
	if step != nil {
		// Middlephase. Fill context only if something matched.
		ctx = fillCtx(ctx, step, stdin, r)
	}
	w := NewHTTPResponseWriter()
	r = r.WithContext(ctx)

	// Phase 3. Generate plain response
	// Create and run handler with error catching throw channel.
	handler, ch := StepHandler(step)
	handler.ServeHTTP(w, r)
	if err := w.Response(r).Write(stdout); err != nil {
		// Error from writing answer is more important.
		return err
	} else {
		// The answer was written successfully, but maybe it is not 200 OK?
		// Get raw error for iteration log.
		return <-ch
	}
}
