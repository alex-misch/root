package flow2

import (
	"container/heap"
	"testing"
)

func TestWorkersHeap(t *testing.T) {
	var h heap.Interface

	t.Run("New", func(t *testing.T) {
		h = WorkersHeap(5)
		ch := h.(workers)

		// maximum available places for workers
		if c := cap(ch); c != 5 {
			t.Fatalf("Expected %q, got %q", 5, c)
		}

		// at creation stage heap must be full
		if l := len(ch); l != 5 {
			t.Fatalf("Expected %q, got %q", 5, l)
		}
	})

	t.Run("Pop", func(t *testing.T) {
		ch := h.(workers)

		// Pop worker from heap
		if worker := h.Pop(); worker != WORKER {
			t.Fatalf("Expected %q, got %q", WORKER, worker)
		}
		// maximum available places for workers
		if c := cap(ch); c != 5 {
			t.Fatalf("Expected %q, got %q", 5, c)
		}
		// at creation stage heap must be full
		if l := len(ch); l != 4 {
			t.Fatalf("Expected %q, got %q", 4, l)
		}
	})

	t.Run("Push", func(t *testing.T) {
		ch := h.(workers)

		// Push worker to heap
		h.Push(nil)
		// maximum available places for workers
		if c := cap(ch); c != 5 {
			t.Fatalf("Expected %q, got %q", 5, c)
		}
		// at creation stage heap must be full
		if l := len(ch); l != 5 {
			t.Fatalf("Expected %q, got %q", 5, l)
		}
	})

	t.Run("Len", func(t *testing.T) {
		if l := h.Len(); l != 5 {
			t.Fatalf("Expected %q, got %q", 5, l)
		}
		h.Pop()
		if l := h.Len(); l != 4 {
			t.Fatalf("Expected %q, got %q", 4, l)
		}
		h.Push(nil)
		if l := h.Len(); l != 5 {
			t.Fatalf("Expected %q, got %q", 5, l)
		}
	})
}
