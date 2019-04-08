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

	t.Run("has", func(t *testing.T) {
		tableTests := []struct {
			flags  uint8
			bit    uint8
			having bool
		}{
			{0, R_CONCURRENT, false},
			{0, W_DELAY, false},

			{W_DELAY, R_CONCURRENT, false},
			{W_DELAY, W_DELAY, true},

			{R_CONCURRENT, R_CONCURRENT, true},
			{R_CONCURRENT, W_DELAY, false},

			{R_CONCURRENT | W_DELAY, R_CONCURRENT, true},
			{R_CONCURRENT | W_DELAY, W_DELAY, true},
		}

		// main goal - no panics
		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if having := newGroup(nil, nil, tt.flags).has(tt.bit); having != tt.having {
					t.Fatalf("Expected \"%t\", got \"%t\"", tt.having, having)
				}
			})
		}
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
