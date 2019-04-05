package flow2

// set of tools for `Step` interface

import (
	"container/heap"
)

// steps is slice of `Step` which implements heap.Interface
type steps []Step

// StepsHeap returns slice of steps as `heap.Interface`
func StepsHeap(ss ...Step) heap.Interface {
	// remove nil steps
	if ss = normalize(ss...); ss != nil {
		sl := steps(ss)
		heap.Init(&sl)
		return &sl
	}

	// heap empty
	return nil
}

// Pop implements heap.Interface
func (ss *steps) Pop() interface{} {
	old := *ss
	n := len(old)

	*ss = make([]Step, n-1) // NOTE: here realloc (bad or good?)
	copy(*ss, old[1:])

	return old[0]
}

// Push implements heap.Interface
// append to slice only if interface is `Step`
func (ss *steps) Push(x interface{}) {
	if step, ok := x.(Step); ok {
		*ss = append(*ss, step)
	}
}

// Len implements sort.Interface
// Len is the number of elements in the collection.
func (ss steps) Len() int {
	return len(ss)
}

// Less implements sort.Interface
// Less reports whether the element with
// index i should sort before the element with index j.
func (ss steps) Less(i, j int) bool {
	return false
}

// Swap implements sort.Interface
// Swap swaps the elements with indexes i and j.
func (ss steps) Swap(i, j int) {
	ss[i], ss[j] = ss[j], ss[i]
}
