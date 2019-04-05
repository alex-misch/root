package flow2

// set of tools for dispatcher logic
// workers, their heaps and all similar concepts

import (
	"container/heap"
)

// WORKER is nil value, just null object in the queue for channel blocking when all workers busy
var WORKER = struct{}{}

// workers is channel type which implements heap.Interface
type workers chan struct{}

// WorkersHeap returns limited workers heap
func WorkersHeap(n int) heap.Interface {
	// create empty heap
	h := workers(make(chan struct{}, n))

	// fill a heap of workers
	for i := 0; i < n; i++ {
		h.Push(nil)
	}

	return h
}

// Pop implements heap.Interface
// Fetch worker from channel if there is one
// otherwise block and wait for him
func (ws workers) Pop() interface{} {
	return <-ws
}

// Push implements heap.Interface
// Returns worker to heap
func (ws workers) Push(x interface{}) {
	// NOTE: if n > left places - this operation will hung
	// TODO: maybe throw error pool full?
	ws <- WORKER
}

// Len implements sort.Interface
// Len is the number of elements in the collection.
func (ws workers) Len() int {
	return len(ws)
}

// Less implements sort.Interface
// Less reports whether the element with
// index i should sort before the element with index j.
func (ws workers) Less(i, j int) bool {
	return false
}

// Swap implements sort.Interface
// Swap swaps the elements with indexes i and j.
func (ws workers) Swap(i, j int) {}
