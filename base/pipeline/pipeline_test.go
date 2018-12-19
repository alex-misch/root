package pipeline

import (
	"bytes"
	"context"
	"fmt"
	"testing"

	"github.com/boomfunc/root/base/tools"
	"github.com/boomfunc/root/tools/flow"
)

func TestPipelineRun(t *testing.T) {
	t.Run("orphan", func(t *testing.T) {
		pipeline := New(
			NewProcess("echo pong"),
		)

		tableTests := []struct {
			ctx context.Context
			err error
		}{
			// no input
			{context.Background(), flow.ErrStepOrphan},                                                                            // - -
			{context.WithValue(context.Background(), "output", 42), flow.ErrStepOrphan},                                           // - +(-)
			{context.WithValue(context.Background(), "output", tools.WriteCloser(bytes.NewBuffer([]byte{}))), flow.ErrStepOrphan}, // - +(+)
			// input wrong type
			{context.WithValue(context.Background(), "input", 42), flow.ErrStepOrphan},                                                                            // +(-) -
			{context.WithValue(context.WithValue(context.Background(), "input", 42), "output", 42), flow.ErrStepOrphan},                                           // +(-) +(-)
			{context.WithValue(context.WithValue(context.Background(), "input", 42), "output", tools.WriteCloser(bytes.NewBuffer([]byte{}))), flow.ErrStepOrphan}, // +(-) +(+)
			// input wright type
			{context.WithValue(context.Background(), "input", tools.ReadCloser(bytes.NewBuffer([]byte{}))), flow.ErrStepOrphan},                                                             // +(+) -
			{context.WithValue(context.WithValue(context.Background(), "input", tools.ReadCloser(bytes.NewBuffer([]byte{}))), "output", 42), flow.ErrStepOrphan},                            // +(+) +(-)
			{context.WithValue(context.WithValue(context.Background(), "input", tools.ReadCloser(bytes.NewBuffer([]byte{}))), "output", tools.WriteCloser(bytes.NewBuffer([]byte{}))), nil}, // +(+) +(+)
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if err := pipeline.Run(tt.ctx); err != tt.err {
					t.Fatalf("Expected %q, got %q", tt.err, err)
				}
			})
		}
	})

	t.Run("processes", func(t *testing.T) {
		// create pipeline
		pipeline := New(
			NewProcess("cat /dev/stdin"), // read 'foobar' from stdin
			NewProcess("rev"),            // reverse -> raboof
			NewProcess("grep -o raboof"), // grep reversed (must be 1 match)
			NewProcess("wc -l"),          // count matches
		)

		// fill the context
		input := bytes.NewBuffer([]byte("foobar"))
		output := bytes.NewBuffer([]byte{})

		ctx := context.Background()
		ctx = context.WithValue(ctx, "input", tools.ReadCloser(input))
		ctx = context.WithValue(ctx, "output", tools.WriteCloser(output))

		if err := pipeline.Run(ctx); err != nil {
			t.Fatal(err)
		}

		// check result
		if outputString := output.String(); outputString != "1\n" {
			t.Fatalf("Expected %q, got %q", "{1\n}", outputString)
		}
	})

	t.Run("mix", func(t *testing.T) {
		// create pipeline
		pipeline := New(
			NewProcess("cat /dev/stdin"),  // read simple http request from process stdin
			NewTCPSocket("golang.org:80"), // and pass to golang.org via socket
		)

		// fill the context
		ctx := context.Background()
		ctx = context.WithValue(ctx, "input", tools.ReadCloser(bytes.NewBuffer([]byte("HEAD / HTTP/1.0\r\n\r\n"))))
		ctx = context.WithValue(ctx, "output", tools.WriteCloser(bytes.NewBuffer([]byte{})))

		if err := pipeline.Run(ctx); err != nil {
			t.Fatal(err)
		}

		// check result
		// t.Log(output)
		// if outputString := fmt.Sprint(output); outputString != "{1\n}" {
		// 	t.Fatalf("Expected %q, got %q", "{1\n}", outputString)
		// }
	})
}
