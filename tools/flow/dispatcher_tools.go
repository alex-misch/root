package flow

// set of tools for dispatcher logic
// workers, their heaps and all similar concepts

import (
	"container/heap"
	"fmt"
)

// WORKER is nil value, just null object in the queue for channel blocking when all workers busy
var WORKER = struct{}{}

// workers is channel type which implements heap.Interface
type workers chan struct{}

// WorkersHeap returns limited workers heap
func WorkersHeap(n int) heap.Interface {
	// Empty heap - no creation need i.e. unlimited resources.
	if n == 0 {
		return nil
	}

	// Create empty heap and fill it with workers.
	h := workers(make(chan struct{}, n))
	for i := 0; i < n; i++ {
		heap.Push(h, nil)
	}
	heap.Init(h)

	return h
}

// Pop implements the heap.Interface
// Fetch worker from channel if there is one
// otherwise block and wait for him
func (ws workers) Pop() interface{} {
	return <-ws
}

// Push implements heap.Interface
// Returns worker to heap
func (ws workers) Push(_ interface{}) {
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

// String implements fmt.Stringer interface
func (ws workers) String() string {
	return fmt.Sprintf("WorkersHeap(%d)", cap(ws))
}
