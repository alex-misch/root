package mux

import (
	"context"
	"net/http"
	"time"

	"github.com/boomfunc/root/tools/router"
)

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

	// Also, fill the context for the layers that they could work as a handler.
	// Provide to the flow ability to set cookies and etc.
	ctx := r.Context()
	ctx = context.WithValue(ctx, "w", w)
	ctx = context.WithValue(ctx, "r", r)

	// Generate body using route Step
	if err := router.Mux(mux).MatchLax(r.URL).Run(ctx, r.Body, w, nil); err != nil {
		// What is the error? We can imagine several situations.
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
