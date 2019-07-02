package flow

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"testing"
)

func finner(ctx context.Context) error {
	// write hello world to stdout
	stdout, ok := ctx.Value("stdout").(io.Writer)
	if !ok {
		return ErrStepOrphan
	}

	_, err := fmt.Fprint(stdout, "Hello world")
	return err
}

func TestFunc(t *testing.T) {
	t.Run("New", func(t *testing.T) {
		tableTests := []struct {
			inner func(context.Context) error // raw function
			isNil bool
		}{
			{nil, true},
			{finner, false},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if step := Func(tt.inner); tt.isNil && (step != nil) {
					t.Fatalf("step: Expected %v, got %q", nil, step)
				} else if !tt.isNil && (step == nil) {
					t.Fatalf("step: Expected %q, got %v", "<Step>", nil)
				}
			})
		}
	})

	t.Run("Run", func(t *testing.T) {
		stdout := bytes.NewBuffer(nil)
		err := Func(finner).Run(
			context.WithValue(context.Background(), "stdout", stdout),
		)

		if err != nil {
			t.Fatal(err)
		}

		if output := stdout.String(); output != "Hello world" {
			t.Fatalf("Expected %q, got %q", "Hello world", output)
		}
	})
}
