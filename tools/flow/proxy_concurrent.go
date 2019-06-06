package flow

import (
	"container/heap"
)

// ConcurrentHeap returns group of steps with R_CONCURRENT flag.
// Receives heap.Interface as `steps`.
// Ability to serve forever through infinity heap.
func ConcurrentHeap(workers, steps heap.Interface) Step {
	return NewGroup(
		workers,
		steps,
		R_CONCURRENT,
	)
}

// Concurrent returns group of steps with R_CONCURRENT flag.
// Receives a slice with known length as `steps`.
func Concurrent(workers heap.Interface, steps ...Step) Step {
	return ConcurrentHeap(workers, StepsHeap(steps...))
}

// DelayConcurrentHeap returns group of steps with R_CONCURRENT flag in background mode.
// Receives heap.Interface as `steps`.
// Ability to serve forever through infinity heap.
func DelayConcurrentHeap(workers, steps heap.Interface) Step {
	return NewGroup(
		workers,
		steps,
		R_CONCURRENT|W_BACKGROUND|CTX_GROUP_ORPHAN,
	)
}

// DelayConcurrent returns group of steps with R_CONCURRENT flag in background mode.
// Receives a slice with known length as `steps`.
func DelayConcurrent(workers heap.Interface, steps ...Step) Step {
	return DelayConcurrentHeap(workers, StepsHeap(steps...))
}
