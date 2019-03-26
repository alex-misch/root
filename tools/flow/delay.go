package flow

import (
	"context"
)

// delay is special type that run steps later
// returns some identifier by which we can get the result later (or cannot)
// like concurrent but we will not wait for finishing
type delay struct {
	immediately Step // Step to run just right now
	dispatcher
}

// Delay creates group of steps, running in parallel (concurrent)
// also with pool of concurrent goroutines
// (just utility function)
// NOTE: delay is same as Dispatcher, but without waiting result (err will be nil)
func Delay(workers int, immediately Step, steps ...Step) Step {
	// filter unusable steps
	steps = normalize(steps...)

	l := len(steps)
	switch {
	case l == 0: // empty step
		return nil
	// case l == 1: // there is single step, no need to group
	// return steps[0]
	// case l <= workers: // subcase , if workers >= steps - just return concurrent without resource limits
	// return concurrent(steps) // inner type creation - no need to normalize and check steps again
	default: // many steps, grouping this with pool of workers
		return &delay{
			immediately: immediately,
			dispatcher: dispatcher{
				workers: make(chan struct{}, workers),
				steps:   steps,
			},
		}
	}
}

func (d *delay) Run(ctx context.Context) error {
	// Phase 1. run immediately step
	if err := ExecuteWithContext(ctx, d.immediately); err != nil {
		return err
	}

	// Phase 1. run async with non wait flag
	// fill the pool of workers (prepare)
	d.add(cap(d.workers))

	// NOTE: looks like workaround: set context to `delayed` mode
	// all subtree will ignore context.Done channel in asynchronous group
	ctx = context.WithValue(ctx, "delay", true)

	// run asynchronous with waiting and with resource limits based on worker's channel
	// NOTE: dispatcher implements `pool` interface itself // TODO: looks not good => move to separate struct
	return newAsync(false, d, d.steps...).Run(context.Background())
}
