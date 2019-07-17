package mux

import (
	"context"
	"mime"
	"net/http"
	"path/filepath"
	"time"

	"github.com/boomfunc/root/tools/flow"
	"github.com/boomfunc/root/tools/router"
)

type stepHandler struct {
	step  flow.SStep
	errCh chan error
}

// ServeHTTP implements http.Handler interfaces.
// Also, can be used as handler to net/http
func (sh *stepHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Close channel in any way.
	defer close(sh.errCh)

	// Set the default headers

	w.Header().Set("Content-Type", mime.TypeByExtension(filepath.Ext(r.URL.Path)))
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

	// Also, fill the context for the layers that they could work as a handler.
	// Provide to the flow ability to set cookies and etc.
	ctx := r.Context()
	ctx = context.WithValue(ctx, "w", w)
	ctx = context.WithValue(ctx, "r", r)

	// Generate body using route Step
	if err := sh.step.Run(ctx, r.Body, w, nil); err != nil {
		// Phase 1. Translate error to channel.
		sh.errCh <- err

		// Phase 2. Translate error to http answer.
		// What is the error? We can imagine several situations.
		// By default - we translate error and text.
		var status int = http.StatusInternalServerError
		var error string = err.Error()

		// Ability to override messages and status for http response.
		switch err {
		case router.ErrNotFound:
			status = http.StatusNotFound
		}

		http.Error(w, error, status)
	}
}

// StepHandler returns a request handler that wraps flow.Step execution
//
// This is http basic logic for base server
func StepHandler(step flow.SStep) (http.Handler, chan error) {
	errCh := make(chan error, 1)

	h := &stepHandler{
		step:  step,
		errCh: errCh,
	}

	return h, errCh
}
