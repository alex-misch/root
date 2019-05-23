package mux

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/boomfunc/root/base/pipeline"
	"github.com/boomfunc/root/base/tools"
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
// BUG: ctx is not visible in http.Handler, until we can set ctx to request
func (mux Router) HTTP(_ context.Context, stdin io.Reader, stdout, stderr io.Writer) error {
	// Phase 1. Parse http request from raw connection
	req, err := http.ReadRequest(bufio.NewReader(stdin))
	if err != nil {
		return err
	}

	// Phase 2. Create response writer
	var b bytes.Buffer
	rw := &httprw{w: &b}

	// Phase 3. Run HTTP handler
	mux.ServeHTTP(rw, req)

	// Phase 4. Generate plain response
	response := http.Response{
		Status:     http.StatusText(rw.Status()),
		StatusCode: rw.Status(),
		Proto:      req.Proto,
		ProtoMajor: req.ProtoMajor,
		ProtoMinor: req.ProtoMinor,
		Body:       tools.ReadCloser(&b),
		Request:    req,
		Header:     rw.h,
	}

	defer response.Body.Close()

	return response.Write(stdout)
}

// ServeHTTP implements http.Handler interfaces.
// This is wrapper for Step interface.
// This is http basic logic for base server
// Also, can be used as handler to net/http
func (mux Router) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Set the default headers
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("X-Content-Type-Options", "nosniff")

	// CORS ISSUE while not structured application layer//
	if r.Header.Get("Origin") != "" {
		// TODO TODO
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		// TODO TODO
	}

	// Override headers that are immutable
	defer func() {
		w.Header().Set("Server", "base/3.0.0-rc6")
		w.Header().Set("Date", time.Now().Format(time.RFC1123))
	}()

	// Fill the context for the layers that they could work as a handler.
	// Provide to the flow ability to set cookies and etc.
	ctx := r.Context()
	ctx = context.WithValue(ctx, "r", r)
	ctx = context.WithValue(ctx, "w", w)

	// Generate body using route Step
	if err := router.Mux(mux).MatchLax(r.URL).Run(ctx, r.Body, w, nil); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
