package application2

import (
	"bytes"
	"testing"
	"context"
	"net/http"
	"fmt"
	"io"
	"encoding/json"
	"strings"

	"github.com/boomfunc/root/tools/router"
	"github.com/boomfunc/root/tools/router/ql"
	"github.com/boomfunc/root/tools/flow"
)

var ssr flow.Step = flow.Func(func(ctx context.Context) error {
	// get output
	stdout, ok := ctx.Value("stdout").(io.Writer)
	if !ok {
		return flow.ErrStepOrphan
	}
	w, ok := ctx.Value("w").(http.ResponseWriter)
	if !ok {
		return flow.ErrStepOrphan
	}

	stdin := strings.NewReader("{\"status\": 302, \"content\": \"<html></html\"}")

	// parse json
	intermediate := struct {
		Status  int
		Content string
		Mime    string
	}{}

	decoder := json.NewDecoder(stdin)
	if err := decoder.Decode(&intermediate); err != nil {
		return fmt.Errorf("bmpjs/ssr: %s", err)
	}

	// translate headers
	w.Header().Set("Content-Type", intermediate.Mime)
	// translate status code
	w.WriteHeader(intermediate.Status)

	// write content to next pipeline layer
	_, err := fmt.Fprint(stdout, intermediate.Content)
	return err
})



var mux Router = []router.Route{
	router.Route{
		Pattern: ql.Regexp("/ping"),
		Step: ssr,
	},
}

func TestHTTP(t *testing.T) {
	var socket bytes.Buffer

	// imitate request
	socket.WriteString("GET /ping HTTP/1.1\r\n\r\n")

	if err := mux.HTTP(nil, &socket, &socket); err != nil {
		t.Fatal(err)
	}

	// check response
	t.Error("========")
	t.Errorf("%s", socket.String())
	t.Error("========")
}
