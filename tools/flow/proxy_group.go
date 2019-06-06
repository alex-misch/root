package flow

import (
	"container/heap"
)

// GroupHeap returns group of steps running step-by-step.
// Receives heap.Interface as `steps`.
// Ability to serve forever through infinity heap.
func GroupHeap(workers, steps heap.Interface) Step {
	return NewGroup(
		workers,
		steps,
		0,
	)
}

// Group returns group of steps running step-by-step.
// Receives a slice with known length as `steps`.
func Group(workers heap.Interface, steps ...Step) Step {
	return GroupHeap(workers, StepsHeap(steps...))
}

// DelayGroupHeap returns group of steps running step-by-step in background mode.
// Receives heap.Interface as `steps`.
// Ability to serve forever through infinity heap.
func DelayGroupHeap(workers, steps heap.Interface) Step {
	return NewGroup(
		workers,
		steps,
		W_BACKGROUND|CTX_GROUP_ORPHAN,
	)
}

// DelayGroup returns group of steps running step-by-step in background mode.
// Receives a slice with known length as `steps`.
func DelayGroup(workers heap.Interface, steps ...Step) Step {
	return DelayGroupHeap(workers, StepsHeap(steps...))
}
