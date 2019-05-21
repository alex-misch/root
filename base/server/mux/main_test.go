package mux

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"

	"github.com/boomfunc/root/tools/router"
	"github.com/boomfunc/root/tools/router/ql"
)

// stdin imitates SSR cli response
func payload() io.Reader {
	return bytes.NewBufferString("{\"status\": 200, \"content\": \"<html></html\"}")
}

type ssr struct{}

func (s ssr) Run(ctx context.Context, stdin io.Reader, stdout, stderr io.Writer) error {
	// Prephase.
	stdin = payload()

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
		w.Header().Set("FOO", "BAR")
	}

	// In any way - content must be written to pipe
	_, err := fmt.Fprint(stdout, intermediate.Content)
	return err
}

var mux Router = []router.Route{
	router.Route{
		Pattern: ql.Regexp("/ssr"),
		Step:    ssr{},
	},
}

func TestHTTP(t *testing.T) {

	t.Run("GET", func(t *testing.T) {
		// imitate request
		socket := bytes.NewBufferString("GET /ssr HTTP/1.1\r\n\r\n")

		if err := mux.HTTP(nil, socket, socket, nil); err != nil {
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

		if err := mux.HTTP(nil, socket, socket, nil); err != nil {
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

	if err := mux.JSON(context.Background(), socket, socket, nil); err != nil {
		t.Fatal(err)
	}

	// check response
	t.Error("========")
	t.Errorf("%s", socket.String())
	t.Error("========")
}
