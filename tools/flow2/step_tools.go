package flow2

// set of tools for `Step` interface

import (
	"container/heap"
	"sync"
)

// steps is slice of `Step` which implements heap.Interface
type steps struct {
	mu    sync.Mutex
	items []Step
}

// StepsHeap returns slice of steps as `heap.Interface`
func StepsHeap(ss ...Step) heap.Interface {
	// remove nil steps
	if ss = normalize(ss...); ss != nil {
		h := &steps{items: ss}
		heap.Init(h)
		return h
	}

	// heap empty
	return nil
}

// Pop implements heap.Interface
func (ss *steps) Pop() interface{} {
	ss.mu.Lock()
	defer ss.mu.Unlock()

	old := ss.items
	n := len(old)

	if n == 0 {
		ss.items = make([]Step, 0) // NOTE: here realloc (bad or good?)
		return nil
	}

	ss.items = make([]Step, n-1) // NOTE: here realloc (bad or good?)
	copy(ss.items, old[1:])

	return old[0]
}

// Push implements heap.Interface
// append to slice only if interface is `Step`
func (ss *steps) Push(x interface{}) {
	step, ok := x.(Step)
	if !ok {
		return
	}

	ss.mu.Lock()
	defer ss.mu.Unlock()

	ss.items = append(ss.items, step)
}

// Len implements sort.Interface
// Len is the number of elements in the collection.
func (ss *steps) Len() int {
	ss.mu.Lock()
	defer ss.mu.Unlock()

	return len(ss.items)
}

// Less implements sort.Interface
// Less reports whether the element with
// index i should sort before the element with index j.
func (ss *steps) Less(i, j int) bool {
	return false
}

// Swap implements sort.Interface
// Swap swaps the elements with indexes i and j.
func (ss *steps) Swap(i, j int) {
	ss.mu.Lock()
	defer ss.mu.Unlock()

	ss.items[i], ss.items[j] = ss.items[j], ss.items[i]
}
