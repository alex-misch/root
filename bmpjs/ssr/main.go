package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"

	"github.com/boomfunc/root/tools/flow"
	"github.com/boomfunc/root/tools/kvs"
)

// JsonEntrypoint is shortcut for `base` which parses output from ssr in json format
// fill `flow` context with status code and mimetype
// TODO: make the layer more transparent -> http or not?, etc
func JsonEntrypoint(ctx context.Context) error {
	// get required context
	stdin, ok := ctx.Value("stdin").(io.Reader)
	if !ok {
		return flow.ErrStepOrphan
	}
	stdout, ok := ctx.Value("stdout").(io.Writer)
	if !ok {
		return flow.ErrStepOrphan
	}
	storage, ok := ctx.Value("db").(kvs.DB)
	if !ok {
		return flow.ErrStepOrphan
	}

	// parse json
	intermediate := struct {
		Status  int
		Content string
	}{}

	decoder := json.NewDecoder(stdin)
	if err := decoder.Decode(&intermediate); err != nil {
		return err
	}

	storage.Set("http", "status", intermediate.Status)

	// write content to next pipeline layer
	_, err := fmt.Fprint(stdout, intermediate.Content)

	return err
}
