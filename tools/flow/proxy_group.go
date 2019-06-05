package flow

import (
	"container/heap"
)

// GroupHeap returns group of steps running step-by-step
// as steps receives heap.Interface
func GroupHeap(workers, steps heap.Interface) Step {
	return NewGroup(
		workers,
		steps,
		0,
	)
}

// Group returns group of steps running step-by-step
// as steps receives as slice of steps
func Group(workers heap.Interface, steps ...Step) Step {
	// since there are a finite number of steps here
	// we can check some situations
	// where we don’t need to create a group
	return GroupHeap(workers, StepsHeap(steps...))
}

// DelayGroupHeap returns group of steps running step-by-step
// in background mode
// as steps receives heap.Interface
func DelayGroupHeap(workers, steps heap.Interface) Step {
	return NewGroup(
		workers,
		steps,
		W_BACKGROUND|CTX_ORPHAN,
	)
}

// DelayGroup returns group of steps running step-by-step
// in background mode
// as steps receives as slice of steps
func DelayGroup(workers heap.Interface, steps ...Step) Step {
	return DelayGroupHeap(workers, StepsHeap(steps...))
}
