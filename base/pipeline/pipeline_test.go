package pipeline

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"reflect"
	"testing"
)

func TestPipeline(t *testing.T) {
	t.Run("New", func(t *testing.T) {
		foo := NewProcess("foo")
		bar := NewProcess("bar")
		baz := NewProcess("baz")

		tableTests := []struct {
			layers   []Layer
			pipeline Pipeline
		}{
			{[]Layer{}, nil},
			{[]Layer{foo}, Pipeline([]Layer{foo})},
			{[]Layer{foo, bar}, Pipeline([]Layer{foo, bar})},
			{[]Layer{foo, bar, baz}, Pipeline([]Layer{foo, bar, baz})},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if pipeline := New(tt.layers...); !reflect.DeepEqual(pipeline, tt.pipeline) {
					t.Fatalf("Expected %v, got %v", tt.pipeline, pipeline)
				}
			})
		}
	})
}

func TestPipelineRun(t *testing.T) {
	t.Run("orphan", func(t *testing.T) {
		pipeline := New(
			NewProcess("echo pong"),
		)

		tableTests := []struct {
			stdin  io.Reader
			stdout io.Writer
			stderr io.Writer
			err    error
		}{
			// no input
			{nil, nil, nil, nil}, // - -
			// {context.WithValue(context.Background(), "output", 42), flow.ErrStepOrphan},                                           // - +(-)
			// {context.WithValue(context.Background(), "output", tools.WriteCloser(bytes.NewBuffer([]byte{}))), flow.ErrStepOrphan}, // - +(+)
			// // input wrong type
			// {context.WithValue(context.Background(), "input", 42), flow.ErrStepOrphan},                                                                            // +(-) -
			// {context.WithValue(context.WithValue(context.Background(), "input", 42), "output", 42), flow.ErrStepOrphan},                                           // +(-) +(-)
			// {context.WithValue(context.WithValue(context.Background(), "input", 42), "output", tools.WriteCloser(bytes.NewBuffer([]byte{}))), flow.ErrStepOrphan}, // +(-) +(+)
			// // input wright type
			// {context.WithValue(context.Background(), "input", tools.ReadCloser(bytes.NewBuffer([]byte{}))), flow.ErrStepOrphan},                                                             // +(+) -
			// {context.WithValue(context.WithValue(context.Background(), "input", tools.ReadCloser(bytes.NewBuffer([]byte{}))), "output", 42), flow.ErrStepOrphan},                            // +(+) +(-)
			// {context.WithValue(context.WithValue(context.Background(), "input", tools.ReadCloser(bytes.NewBuffer([]byte{}))), "output", tools.WriteCloser(bytes.NewBuffer([]byte{}))), nil}, // +(+) +(+)
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if err := pipeline.Run(context.Background(), tt.stdin, tt.stdout, tt.stderr); err != tt.err {
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
		stdin := bytes.NewBuffer([]byte("foobar"))
		stdout := bytes.NewBuffer([]byte{})

		if err := pipeline.Run(context.Background(), stdin, stdout, nil); err != nil {
			t.Fatal(err)
		}

		// check result
		if stdoutString := stdout.String(); stdoutString != "1\n" {
			t.Fatalf("Expected %q, got %q", "{1\n}", stdoutString)
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
		stdin := bytes.NewBuffer([]byte("HEAD / HTTP/1.0\r\n\r\n"))
		stdout := bytes.NewBuffer(nil)

		if err := pipeline.Run(ctx, stdin, stdout, nil); err != nil {
			t.Fatal(err)
		}

		// check result
		// t.Log(output)
		// if outputString := fmt.Sprint(output); outputString != "{1\n}" {
		// 	t.Fatalf("Expected %q, got %q", "{1\n}", outputString)
		// }
	})
}
