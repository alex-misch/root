package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/boomfunc/root/tools/flow"
)

// JsonEntrypoint is shortcut for `base` which parses output from ssr in json format
// fill `flow` context with status code and mimetype
func JsonEntrypoint(ctx context.Context) error {
	// TODO: deprecated phase
	stdin, ok := ctx.Value("stdin").(io.Reader)
	if !ok {
		return flow.ErrStepOrphan
	}
	stdout, ok := ctx.Value("stdout").(io.Writer)
	if !ok {
		return flow.ErrStepOrphan
	}
	// TODO: end of deprecated phase


	// Phase 1. Parse json returned from ssr cli
	intermediate := struct {
		Status  int
		Content string
		Mime    string
	}{}

	if err := json.NewDecoder(stdin).Decode(&intermediate); err != nil {
		return fmt.Errorf("bmpjs/ssr: %s", err)
	}

	// Phase 3. If we have HTTP mode - set headers and status code
	w, http := ctx.Value("w").(http.ResponseWriter)
	if http {
		w.Header().Set("Content-Type", intermediate.Mime)
		w.WriteHeader(intermediate.Status)
	}

	// In any way - content must be written to pipe
	_, err := fmt.Fprint(stdout, intermediate.Content)
	return err
}
