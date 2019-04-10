package flow2

import (
	"container/heap"
)

// ConcurrentHeap returns group of steps with R_CONCURRENT flag
// as steps receives heap.Interface
func ConcurrentHeap(workers, steps heap.Interface) Step {
	return newGroup(
		steps,
		workers,
		R_CONCURRENT,
	)
}

// Concurrent returns group of steps with R_CONCURRENT flag
// as steps receives as slice of steps
func Concurrent(workers heap.Interface, steps ...Step) Step {
	return newGroup(
		StepsHeap(steps...),
		workers,
		R_CONCURRENT,
	)
}

// DelayConcurrentHeap returns group of steps with R_CONCURRENT flag
// in background mode
// as steps receives heap.Interface
func DelayConcurrentHeap(workers, steps heap.Interface) Step {
	return newGroup(
		steps,
		workers,
		R_CONCURRENT|W_DELAY|CTX_ORPHAN,
	)
}

// DelayConcurrent returns group of steps with R_CONCURRENT flag
// in background mode
// as steps receives as slice of steps
func DelayConcurrent(workers heap.Interface, steps ...Step) Step {
	return newGroup(
		StepsHeap(steps...),
		workers,
		R_CONCURRENT|W_DELAY|CTX_ORPHAN,
	)
}
