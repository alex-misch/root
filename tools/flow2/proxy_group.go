package flow2

import (
	"container/heap"
)

func Group(workers, steps heap.Interface) Step {
	return newGroup(steps, workers, 0)
}

func DelayGroup(workers, steps heap.Interface) Step {
	return newGroup(steps, workers, G_DELAY)
}
