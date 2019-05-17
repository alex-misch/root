package application2

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

	"github.com/boomfunc/root/base/tools"
	"github.com/boomfunc/root/tools/router"
)

// Entrypoint is the main type used as multiplexer
type Entrypoint func(context.Context, io.Reader, io.Writer) error

// Router is type wrapper
// Implements several application handlers
type Router router.Mux

func (mux Router) serve(ctx context.Context, u *url.URL) error {
	route, err := router.Mux(mux).Match(u)
	if err != nil {
		return err
	}

	return route.Run(ctx)
}

// JSON is the raw data handler enrtypoint
func (mux Router) JSON(ctx context.Context, r io.Reader, w io.Writer) error {
	intermediate := struct {
		Url   string
		Stdin string
	}{}

	decoder := json.NewDecoder(r)
	if err := decoder.Decode(&intermediate); err != nil {
		return err
	}

	u, err := url.Parse(intermediate.Url)
	if err != nil {
		return err
	}

	ctx = context.WithValue(ctx, "stdin", strings.NewReader(intermediate.Stdin))
	ctx = context.WithValue(ctx, "stdout", w)

	return mux.serve(ctx, u)
}

// HTTP is the http logic handler enrtypoint.
// Parse request as http
// Run http handler.
// Pack response as http.
func (mux Router) HTTP(_ context.Context, r io.Reader, w io.Writer) error {
	// Phase 1. Parse http request from raw connection
	req, err := http.ReadRequest(bufio.NewReader(r))
	if err != nil {
		return err
	}

	// Phase 2. Create response writer
	var b bytes.Buffer
	rw := &httprw{w: &b}

	// Phase 3. Run HTTP handler
	mux.ServeHTTP(rw, req)

	// Phase 4. Generate response
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

	return response.Write(w)
}

// ServeHTTP implements http.Handler interfaces.
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

	// Fill the context for i/o piping
	ctx := r.Context()
	ctx = context.WithValue(ctx, "stdin", r.Body)
	ctx = context.WithValue(ctx, "stdout", w)

	// Fill the context for the layers that they could work as a handler.
	// Provide to the flow ability to set cookies and etc.
	ctx = context.WithValue(ctx, "r", r)
	ctx = context.WithValue(ctx, "w", w)

	// Generate body using route Step
	if err := mux.serve(ctx, r.URL); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
