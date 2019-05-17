package application2

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"

	"github.com/boomfunc/root/tools/flow"
	"github.com/boomfunc/root/tools/router"
	"github.com/boomfunc/root/tools/router/ql"
)

// stdin imitates SSR cli response
var stdin io.Reader = bytes.NewBufferString("{\"status\": 200, \"content\": \"<html></html\"}")

var ssr flow.Step = flow.Func(func(ctx context.Context) error {
	// Phase 1. Get required context (pipe's ends)
	stdout, ok := ctx.Value("stdout").(io.Writer)
	if !ok {
		return flow.ErrStepOrphan
	}

	// Phase 2. Parse json returned from ssr cli
	intermediate := struct {
		Status  int
		Content string
		Mime    string
	}{}

	decoder := json.NewDecoder(stdin)
	if err := decoder.Decode(&intermediate); err != nil {
		return fmt.Errorf("bmpjs/ssr: %s", err)
	}

	// Phase 3. If we have HTTP mode - set headers and status code
	if w, ok := ctx.Value("w").(http.ResponseWriter); ok {
		w.Header().Set("Content-Type", intermediate.Mime)
		w.WriteHeader(intermediate.Status)
		w.Header().Set("FOO", "BAR")
	}

	// In any way - content must be written to pipe
	_, err := fmt.Fprint(stdout, intermediate.Content)
	return err
})

var mux Router = []router.Route{
	router.Route{
		Pattern: ql.Regexp("/ssr"),
		Step:    ssr,
	},
}

func TestHTTP(t *testing.T) {

	t.Run("GET", func(t *testing.T) {
		// imitate request
		socket := bytes.NewBufferString("GET /ssr HTTP/1.1\r\n\r\n")

		if err := mux.HTTP(nil, socket, socket); err != nil {
			t.Fatal(err)
		}

		// check response
		t.Error("========")
		t.Errorf("%s", socket.String())
		t.Error("========")
	})

	t.Run("HEAD", func(t *testing.T) {
		// imitate request
		socket := bytes.NewBufferString("HEAD /ssr HTTP/1.1\r\n\r\n")

		if err := mux.HTTP(nil, socket, socket); err != nil {
			t.Fatal(err)
		}

		// check response
		t.Error("========")
		t.Errorf("%s", socket.String())
		t.Error("========")
	})

}

func TestJSON(t *testing.T) {
	// imitate request
	socket := bytes.NewBufferString("{\"url\":\"/ssr\"}")

	if err := mux.JSON(context.Background(), socket, socket); err != nil {
		t.Fatal(err)
	}

	// check response
	t.Error("========")
	t.Errorf("%s", socket.String())
	t.Error("========")
}
