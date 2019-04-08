package flow2

import (
	"container/heap"
	"context"
	"errors"
	"fmt"
	"testing"
)

func TestGroupPrivate(t *testing.T) {
	t.Run("closeStep", func(t *testing.T) {
		// preparing
		workers := WorkersHeap(2)
		heap.Pop(workers)
		g := &group{workers: workers}
		g.wg.Add(1)

		// check worker returned and waiting count decreased
		g.closeStep()
		if l := workers.Len(); l != 2 {
			t.Fatalf("Expected %q, got %q", 2, l)
		}

		// WaitGroup must not hung
		g.wg.Wait()
	})

	t.Run("wait", func(t *testing.T) {
		t.Run("no", func(t *testing.T) {
			// no error
			errCh := make(chan error, 1)
			g := &group{errCh: errCh}
			if err := g.wait(); err != nil {
				t.Fatal(err)
			}
		})

		t.Run("yes", func(t *testing.T) {
			// with error
			errCh := make(chan error, 1)
			g := &group{errCh: errCh}
			errCh <- errors.New("FOOBAR")
			if err := g.wait(); err.Error() != "FOOBAR" {
				t.Fatalf("Expected %q, got %q", "FOOBAR", err.Error())
			}
		})
	})
}

func TestGroupPublic(t *testing.T) {
	t.Run("Close", func(t *testing.T) {
		tableTests := []struct {
			ch     chan error
			cancel context.CancelFunc
		}{
			{nil, nil},
			{nil, func() {}},
			{make(chan error), nil},
			{make(chan error), func() {}},
			// TODO: also, channel might be already closed
		}

		// main goal - no panics
		g := &group{}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				g.errCh = tt.ch
				g.cancel = tt.cancel
				if err := g.Close(); err != nil {
					t.Fatal(err)
				}
			})
		}
	})
}
