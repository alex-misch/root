package flow

import (
	"context"
	"fmt"
	"strings"
)

// worker is nil value, just null object in the queue for channel blocking when all workers busy
var worker = struct{}{}

// dispatcher is like cncurrent but with limitation of running routines (workers)
type dispatcher struct {
	workers chan struct{}
	steps   []Step
}

// Dispatcher creates group of steps, running in parallel (concurrent)
// also with pool of concurrent goroutines
// (just utility function)
// NOTE: dispatcher is same as Concurrent, but with pool provided
func Dispatcher(workers int, steps ...Step) Step {
	// filter unusable steps
	steps = normalize(steps...)

	l := len(steps)
	switch {
	case l == 0: // empty step
		return nil
	case l == 1: // there is single step, no need to group
		return steps[0]
	case l <= workers: // subcase , if workers >= steps - just return concurrent without resource limits
		return concurrent(steps) // inner type creation - no need to normalize and check steps again
	default: // many steps, grouping this with pool of workers
		return &dispatcher{
			workers: make(chan struct{}, workers),
			steps:   steps,
		}
	}
}

// wait waits for nearest freed resource in channel (blocking operation)
// this will block until all workers is idle
// NOTE: wait implements `pool` interface
func (d *dispatcher) wait() {
	<-d.workers
}

// release is just shortcut for releasing single worker
// NOTE: wait implements `pool` interface
func (d *dispatcher) release() {
	<-d.workers
}

// add adds worker to channel
// This means that free resources have appeared in the resource pool
// and tasks can be performed.
func (d *dispatcher) add(n int) {
	// NOTE: if n > left places - this operation will hung
	// TODO: maybe throw error pool full?
	for i := 0; i < n; i++ {
		d.workers <- worker
	}
}

func (d *dispatcher) Run(ctx context.Context) error {
	// fill the pool of workers (prepare)
	d.add(cap(d.workers))
	// run asynchronous with waiting and with resource limits based on worker's channel
	// NOTE: dispatcher implements `pool` interface itself // TODO: looks not good => move to separate struct
	return asynchronous(ctx, true, d, d.steps...)
}

// String implements fmt.Stringer interface
func (d *dispatcher) String() string {
	parts := make([]string, len(d.steps))

	for i, step := range d.steps {
		parts[i] = fmt.Sprintf("\t%s", step)
	}

	return fmt.Sprintf("DISPATCHER(\n%s\n)", strings.Join(parts, ",\n"))
}
