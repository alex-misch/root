package mux

// Set of tools for quick graphql implementation.

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"

	"github.com/boomfunc/root/tools/flow"
	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"
)

// GraphQL returns step that generates graphql server with provided schema.
func GraphQL(schema graphql.Schema) flow.Step {
	return flow.Func(func(ctx context.Context) error {
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

		w, ok := ctx.Value("w").(http.ResponseWriter)
		if ok {
			// If we have HTTP mode - modify headers.
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
		}

		// Phase 1. Fetch graphql query.
		var query string

		// Also, in http mode, a query can be in get parameters or post body.
		if r, _ := ctx.Value("r").(*http.Request); ok && r.Method == "GET" {
			query = r.URL.Query().Get("query")
		} else {
			// In other cases (`no http` or `post request`) the query is the stdin itself.
			var b bytes.Buffer
			b.ReadFrom(stdin)
			query = b.String()
		}

		// Phase 2. Run graphql and return results.
		result := graphql.Do(graphql.Params{
			Schema:        schema,
			RequestString: query,
		})
		return json.NewEncoder(stdout).Encode(result)
	})
}

// GraphiQL returns step that generates graphql playground with provided schema.
func GraphiQL(schema graphql.Schema) flow.Step {
	return flow.Func(func(ctx context.Context) error {
		w, ok := ctx.Value("w").(http.ResponseWriter)
		if !ok {
			return nil
		}

		r, _ := ctx.Value("r").(*http.Request)
		w.Header().Set("Content-Type", "text/html; charset=utf-8")

		// Use builtin handler.
		handler.New(&handler.Config{
			Schema:   &schema,
			Pretty:   true,
			GraphiQL: true,
		}).ServeHTTP(w, r)

		return nil
	})
}
