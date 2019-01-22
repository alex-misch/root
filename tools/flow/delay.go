package flow

import (
	"context"
)

// delay is special type that run steps later
// returns some identifier by which we can get the result later (or cannot)
// like concurrent but we will not wait for finishing
type delay struct {
	dispatcher
}

// Delay creates group of steps, running in parallel (concurrent)
// also with pool of concurrent goroutines
// (just utility function)
// NOTE: delay is same as Dispatcher, but without waiting result (err will be nil)
func Delay(workers int, steps ...Step) Step {
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
		return &delay{
			dispatcher{
				workers: make(chan struct{}, workers),
				steps:   steps,
			},
		}
	}
}

func (d *delay) Run(ctx context.Context) error {
	// fill the pool of workers (prepare)
	d.add(cap(d.workers))
	// run asynchronous with waiting and with resource limits based on worker's channel
	// NOTE: dispatcher implements `pool` interface itself // TODO: looks not good => move to separate struct
	return newAsync(false, d, d.steps...).Run(ctx)
}
