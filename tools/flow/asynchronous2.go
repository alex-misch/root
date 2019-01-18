package flow

import (
	"container/heap"
	"context"
	"sync"
)

type async struct {
	wait    bool           // indicates caller wait for result of async group
	closed  bool           // the flag indicates that we don't wait any information on channels and channels was closed
	workers heap.Interface // workers heap to control concurrent num restrictions
	// TODO steps   heap.Interface // steps to run asynchronously
	steps []Step

	wg     sync.WaitGroup
	errCh  chan error    // channel for collecting errors from steps
	doneCh chan struct{} // channel indicates `async` step completes
}

func newAsync(wait bool, workers heap.Interface, steps ...Step) *async {
	// fill the group by default and required values
	group := &async{
		wait:    wait,
		workers: workers,
		steps:   steps,
	}

	// NOTE: synchronization channels required ONLY if we want to wait for results
	// if delay mode - no need to store errors and etc.
	if wait {
		group.errCh = make(chan error, 1)
		group.doneCh = make(chan struct{}, 1)
	}

	return group
}

// execute is a tool for simply run step and decrease wait counter
func (group *async) execute(ctx context.Context, cancel context.CancelFunc, step Step) {
	defer func() {
		// if we don't need to wait for flow execution - disable sync logic
		if group.wait {
			group.wg.Done() // release waiting
		}

		// NOTE: workers interface might be nil => no limits and no wait-release logic
		if group.workers != nil {
			group.workers.Push(worker) // release working resources. `worker`
		}
	}()

	// check for incoming signal of uselessness of this function
	select {
	case <-ctx.Done():
		// context cancelled by another function
		// no need for starting execution of `fn`
	default:
		// Default is must to avoid blocking
		// we can start atomic function execution
		if err := step.Run(ctx); err != nil {
			if !group.closed {
				group.errCh <- err
				cancel()
			}
		}
	}
}

func (group *async) Run(ctx context.Context) error {
	ctx, cancel := context.WithCancel(ctx) // TODO: Is this a duplication of functionality in flow.Execute() ?

	// Make sure it's called to release resources even if no errors
	defer func() {
		group.closed = true
		close(group.errCh)
		close(group.doneCh)
		cancel()
	}()

	// iterate over steps and run goroutines
	// for {
	// 	// Phase 1. Get step
	// 	step, ok := group.steps.Pop().(Step)
	// 	if !ok {
	// 		break
	// 	}
	for _, step := range group.steps {
		// Phase 2. Get worker
		// NOTE: workers interface might be nil => no limits and no wait-release logic
		if group.workers != nil {
			group.workers.Pop() // blocking operation
		}

		// Phase 3. Waiting counter
		// if we don't need to wait for flow execution - disable sync logic
		// backwards operation at `group.execute.defer`
		if group.wait {
			group.wg.Add(1)
		}

		// Phase 4. Run step in goroutine
		go group.execute(ctx, cancel, step)
	}

	// all the routines were running, now we can wait for results or exit if the delay mode is enabled
	if !group.wait {
		return nil
	}

	// case with waiting results
	// NOTE: we expecting errCh and doneCh != nil (look at `newAsync` func)
	// special goroutine, indicates all done without hang
	go func() {
		group.wg.Wait() // wait until all completed
		if !group.closed {
			group.doneCh <- struct{}{} // send complete signal to select below
		}
	}()

	// waiting for results and return this
	select {
	case err := <-group.errCh:
		return err
	case <-group.doneCh:
		// handle errors from concurrent goroutines
		return errs(group.errCh) // also try to fetch error
	}
}
