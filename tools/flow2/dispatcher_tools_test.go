package flow2

import (
	"container/heap"
	"fmt"
	"testing"
)

func check(t *testing.T, h heap.Interface, c, l int) {
	// get raw channel type
	ch := h.(workers)

	// check capacity
	if got := cap(ch); got != c {
		t.Fatalf("cap: Expected %q, got %q", c, got)
	}
	// check lenght
	if got := len(ch); got != l {
		t.Fatalf("len: Expected %q, got %q", l, got)
	}
	if got := h.Len(); got != l {
		t.Fatalf("Len: Expected %q, got %q", l, got)
	}
}

func TestWorkersHeap(t *testing.T) {
	var h heap.Interface

	t.Run("New", func(t *testing.T) {
		tableTests := []struct {
			n     int  // requested workers
			isNil bool // is output heap nil
			c     int  // heap initial capacity
			l     int  // heap initial length
		}{
			{0, true, 0, 0},
			{1, false, 1, 1},
			{5, false, 5, 5},
		}
		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				h = WorkersHeap(tt.n)

				if tt.isNil && h != nil {
					t.Fatalf("h: Expected %v, got %q", nil, h)
				} else {
					check(t, h, tt.c, tt.l) // at the beginning capacity and len are full
				}
			})
		}
	})

	t.Run("Pop", func(t *testing.T) {
		// pop all workers!
		for i := 0; i < 5; i++ {
			// Pop worker from heap
			if worker := h.Pop(); worker != WORKER {
				t.Fatalf("Expected %q, got %q", WORKER, worker)
			}
			check(t, h, 5, 5-(i+1))
		}
		check(t, h, 5, 0)
		// next .Pop() will hung, not enough free workers
	})

	t.Run("Push", func(t *testing.T) {
		// after all .Pop - empty dispatcher
		check(t, h, 5, 0)
		// return all workers to heap
		for i := 0; i < 5; i++ {
			// Pop worker from heap
			h.Push(nil)
			check(t, h, 5, i+1)
		}
		check(t, h, 5, 5)
		// next .Push() will hung, because not enough free space in dispatcher
	})
}
