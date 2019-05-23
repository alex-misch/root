package flow

import (
	"bytes"
	"fmt"
	"io"
	"reflect"
	"testing"
)

func TestOptions(t *testing.T) {
	stdin := bytes.NewBufferString("stdin")
	stdout := bytes.NewBuffer(nil)
	stderr := bytes.NewBuffer(nil)

	stdin2 := bytes.NewBufferString("stdin2")
	stdout2 := bytes.NewBuffer(nil)

	opts := NewOptions(stdin, stdout, stderr)
	optsPtr := reflect.ValueOf(opts).Pointer()

	t.Run("Stdin", func(t *testing.T) {
		if !reflect.DeepEqual(stdin, opts.Stdin()) {
			t.Fatalf("expected %q, got %q", opts.Stdin(), stdin)
		}
	})

	t.Run("Stdout", func(t *testing.T) {
		if !reflect.DeepEqual(stdout, opts.Stdout()) {
			t.Fatalf("expected %q, got %q", opts.Stdout(), stdout)
		}
	})

	t.Run("Stderr", func(t *testing.T) {
		if !reflect.DeepEqual(stderr, opts.Stderr()) {
			t.Fatalf("expected %q, got %q", opts.Stderr(), stderr)
		}
	})

	t.Run("Update", func(t *testing.T) {
		tableTests := []struct {
			stdin  io.Reader
			stdout io.Writer
			stderr io.Writer

			outstdin  io.Reader
			outstdout io.Writer
			outstderr io.Writer
		}{
			{nil, nil, nil, stdin, stdout, stderr},
			{stdin2, nil, nil, stdin2, stdout, stderr},
			{stdin2, stdout2, stdout2, stdin2, stdout2, stdout2},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				new := opts.Update(tt.stdin, tt.stdout, tt.stderr)

				// first check - must be returned copy of options
				if ptr := reflect.ValueOf(new).Pointer(); ptr == optsPtr {
					t.Fatal("expected copy of opts")
				}

				// old options should not change the address
				if ptr := reflect.ValueOf(opts).Pointer(); ptr != optsPtr {
					t.Fatalf("expected %q, got %q", optsPtr, ptr)
				}

				// check inner attributes
				if ptr := reflect.ValueOf(new.Stdin()).Pointer(); ptr != reflect.ValueOf(tt.outstdin).Pointer() {
					t.Fatal("unexpected stdin")
				}
				if ptr := reflect.ValueOf(new.Stdout()).Pointer(); ptr != reflect.ValueOf(tt.outstdout).Pointer() {
					t.Fatal("unexpected stdout")
				}
				if ptr := reflect.ValueOf(new.Stderr()).Pointer(); ptr != reflect.ValueOf(tt.outstderr).Pointer() {
					t.Fatal("unexpected stderr")
				}
			})
		}
	})
}
