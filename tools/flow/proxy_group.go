package flow

import (
	"container/heap"
)

// GroupHeap returns group of steps running step-by-step
// as steps receives heap.Interface
func GroupHeap(workers, steps heap.Interface) Step {
	return newGroup(
		steps,
		workers,
		0,
	)
}

// Group returns group of steps running step-by-step
// as steps receives as slice of steps
func Group(workers heap.Interface, steps ...Step) Step {
	// since there are a finite number of steps here
	// we can check some situations
	// where we don’t need to create a group
	//
	// TODO: need to create ability to run Step with workers logic (without group wrapper)
	//
	return newGroup(
		StepsHeap(steps...),
		workers,
		0,
	)
}

// DelayGroupHeap returns group of steps running step-by-step
// in background mode
// as steps receives heap.Interface
func DelayGroupHeap(workers, steps heap.Interface) Step {
	return newGroup(
		steps,
		workers,
		W_DELAY|CTX_ORPHAN,
	)
}

// DelayGroup returns group of steps running step-by-step
// in background mode
// as steps receives as slice of steps
func DelayGroup(workers heap.Interface, steps ...Step) Step {
	return newGroup(
		StepsHeap(steps...),
		workers,
		W_DELAY|CTX_ORPHAN,
	)
}
