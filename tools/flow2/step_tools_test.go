package flow2

import (
	"container/heap"
	"context"
	"fmt"
	"testing"
)

func TestStepsHeap(t *testing.T) {
	var a, b, c Step
	var h heap.Interface

	a = Func(func(ctx context.Context, input Filer, output Filer) error {
		return nil
	})
	c = Func(func(ctx context.Context, input Filer, output Filer) error {
		return nil
	})

	t.Run("New", func(t *testing.T) {
		tableTests := []struct {
			steps []Step
			isNil bool
			len   int
			cap   int
		}{
			{[]Step{a, b, c}, false, 2, 2},
			{[]Step{}, true, 3, 3},
			{[]Step{nil}, true, 3, 3},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				h = StepsHeap(tt.steps...)
				if cond := (h == nil); tt.isNil != cond {
					t.Fatalf("Expected \"%t\", got \"%t\"", tt.isNil, cond)
				}

				// if heap is nil - no need to check below
				if tt.isNil {
					return
				}

				// maximum available places for steps
				// because
				if c := cap(h.(*steps).items); c != tt.cap {
					t.Fatalf("Expected %q, got %q", tt.cap, c)
				}
				// at creation stage heap equal to capacity (slice already allocated)
				if l := len(h.(*steps).items); l != tt.len {
					t.Fatalf("Expected %q, got %q", tt.len, l)
				}
			})
		}
	})

	h = StepsHeap(a, b, c) // len, cap = 2, 2

	t.Run("Pop", func(t *testing.T) {
		// Pop step from heap
		if step := h.Pop(); step == nil {
			t.Fatalf("Expected %q, got %v", "Step", nil)
		}
		// maximum available places for steps
		if c := cap(h.(*steps).items); c != 1 {
			t.Fatalf("Expected %q, got %q", 1, c)
		}
		// at creation stage heap must be full
		if l := len(h.(*steps).items); l != 1 {
			t.Fatalf("Expected %q, got %q", 1, l)
		}
	})

	t.Run("Push", func(t *testing.T) {
		tableTests := []struct {
			step Step
			len  int
			cap  int
		}{
			{nil, 1, 1}, // nil step - ignore
			{a, 2, 2},   // non-nil step - add
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				// Push step to heap
				h.Push(tt.step)
				// maximum available places for steps
				if c := cap(h.(*steps).items); c != tt.cap {
					t.Fatalf("Expected %q, got %q", tt.cap, c)
				}
				// at creation stage heap must be full
				if l := len(h.(*steps).items); l != tt.len {
					t.Fatalf("Expected %q, got %q", tt.len, l)
				}
			})
		}
	})

	t.Run("Len", func(t *testing.T) {
		if l := h.Len(); l != 2 {
			t.Fatalf("Expected %q, got %q", 2, l)
		}
		h.Pop()
		if l := h.Len(); l != 1 {
			t.Fatalf("Expected %q, got %q", 1, l)
		}
		h.Push(nil)
		if l := h.Len(); l != 1 {
			t.Fatalf("Expected %q, got %q", 1, l)
		}
	})
}
