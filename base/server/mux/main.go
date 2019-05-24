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
	"github.com/boomfunc/root/tools/router"
)

// Router is type wrapper
// Implements several application handlers
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
	// Phase 1. Parse payload as JSON
	intermediate := struct {
		Url   string
		Stdin string
	}{}
	if err := json.NewDecoder(stdin).Decode(&intermediate); err != nil {
		return err
	}

	u, err := url.Parse(intermediate.Url)
	if err != nil {
		return err
	}

	// NOTE: new stdin - Stdin from parsed json
	return router.Mux(mux).MatchLax(u).Run(ctx, strings.NewReader(intermediate.Stdin), stdout, stderr)
}

// HTTP is the http logic handler entrypoint.
// Parse request as http
// Run http handler.
// Pack response as http.
func (mux Router) HTTP(ctx context.Context, stdin io.Reader, stdout, stderr io.Writer) error {
	// Phase 1. Parse payload as plain http request
	r, err := http.ReadRequest(bufio.NewReader(stdin))
	if err != nil {
		return err
	}

	// Phase 2. Run http.Handler
	// 1. Create response writer
	// 2. Tranform request to use out cancellation context.
	w := NewHTTPResponseWriter()
	r = r.WithContext(ctx)
	mux.ServeHTTP(w, r)

	// Phase 3. Generate plain response
	return w.Response(r).Write(stdout)
}
