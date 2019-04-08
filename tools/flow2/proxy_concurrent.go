package flow2

import (
	"container/heap"
)

func Concurrent(workers, steps heap.Interface) Step {
	return newGroup(steps, workers, R_CONCURRENT)
}

func DelayConcurrent(workers, steps heap.Interface) Step {
	return newGroup(steps, workers, R_CONCURRENT|W_DELAY)
}
