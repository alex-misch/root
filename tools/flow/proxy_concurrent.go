package flow

import (
	"container/heap"
)

// ConcurrentHeap returns group of steps with R_CONCURRENT flag
// as steps receives heap.Interface
func ConcurrentHeap(workers, steps heap.Interface) Step {
	return NewGroup(
		workers,
		steps,
		R_CONCURRENT,
	)
}

// Concurrent returns group of steps with R_CONCURRENT flag
// as steps receives as slice of steps
func Concurrent(workers heap.Interface, steps ...Step) Step {
	return ConcurrentHeap(workers, StepsHeap(steps...))
}

// DelayConcurrentHeap returns group of steps with R_CONCURRENT flag
// in background mode
// as steps receives heap.Interface
func DelayConcurrentHeap(workers, steps heap.Interface) Step {
	return NewGroup(
		workers,
		steps,
		R_CONCURRENT|W_BACKGROUND|CTX_ORPHAN,
	)
}

// DelayConcurrent returns group of steps with R_CONCURRENT flag
// in background mode
// as steps receives as slice of steps
func DelayConcurrent(workers heap.Interface, steps ...Step) Step {
	return DelayConcurrentHeap(workers, StepsHeap(steps...))
}
