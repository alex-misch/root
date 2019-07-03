package mux

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/boomfunc/root/base/pipeline"
	"github.com/boomfunc/root/base/tools"
	"github.com/boomfunc/root/tools/kvs"
	"github.com/boomfunc/root/tools/router"
)

var (
	ErrMalformedHTTPRequest = errors.New("base/server/mux: Malformed HTTP request.") // We cannot parse incoming http request.
	ErrMalformedJSONRequest = errors.New("base/server/mux: Malformed JSON request.") // We cannot parse incoming json request.
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

		dump, _ := httputil.DumpRequest(r, false)
		fmt.Printf("INCOMING REQUEST: %q\n", dump)

		fmt.Println("r.Host:", r.Host)
		fmt.Println("r.Header.Get(\"Host\"):", r.Header.Get("Host"))
		fmt.Println("r.RequestURI:", r.RequestURI)

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
		// The parsing error might be very long so we will hide it under common error.
		return ErrMalformedJSONRequest
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
		// The parsing error might be very long so we will hide it under common error.
		return ErrMalformedHTTPRequest
	}

	// Part of the workaround with url for iteration.
	// Look at heap.go
	if url, ok := ctx.Value("base.request.url").(*string); ok {
		*url = r.URL.RequestURI()
	}

	// Phase 2. Run http.Handler
	// 1. Create response writer
	// 2. Tranform request to use out cancellation context.
	// 3. Run via StepHandler
	step := router.Mux(mux).MatchLax(r.URL)
	if step != nil {
		// Middlephase. Fill context only if something matched.
		ctx = fillCtx(ctx, step, stdin, r)
	}
	w := NewHTTPResponseWriter()
	r = r.WithContext(ctx)

	StepHandler(step).ServeHTTP(w, r)

	// Phase 3. Generate plain response
	return w.Response(r).Write(stdout)
}
