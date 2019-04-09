package flow2

import (
	"container/heap"
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
		h = WorkersHeap(5)
		check(t, h, 5, 5) // at the beginning capacity and len are full
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
