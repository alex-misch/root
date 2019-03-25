package flow

import (
	"context"
	"sync"
)

// BUG: take a closer look at sync.mutex blocking:
// 1. executeStep.defer
// 2. close.channels
// 3. Run.loop
// 4. Run.wait

// Set of tools for concurrent flow running
// there is some variants:
// waiting response
// control cocurrently working goroutines throw `pool` interface
//
// some examples:
//
// with wait and without any concurrent num restrictions - `Concurrent`
// with wait and with concurrent num restrictions - `Dispatcher`
// without wait and without any concurrent num restrictions - ??????? (TODO)
// without wait and with concurrent num restrictions - `Delay`

// errs is internal API tool for collecting erros from multiple routines or somethink else
// sended throw channel
func errs(errCh chan error) error {
	// returning errors (from buffered channel if exists or nil)
	select {
	case err := <-errCh:
		// context cancelled by another function
		// no need for starting execution of this fn
		return err
	default:
		// Default is must be to avoid blocking
		return nil
	}
}

type async struct {
	wait   bool // indicates caller wait for result of async group
	closed bool // the flag indicates that we don't wait any information on channels and channels was closed
	// TODO:
	// workers heap.Interface // workers heap to control concurrent num restrictions
	// steps   heap.Interface // steps to run asynchronously
	workers pool
	steps   []Step

	mutex  sync.Mutex
	wg     sync.WaitGroup
	errCh  chan error    // channel for collecting errors from steps
	doneCh chan struct{} // channel indicates `async` step completes
}

// newAsync is a special tool that running steps concurrently
// error resolving by channels
// cancellation in case of error through context cancellation
// wait for completion through sync.WaitGroup
func newAsync(wait bool, workers pool, steps ...Step) *async {
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

// executeStep is a single step invoсation from flow and cancel flow if error returns
// if error fetched through context cancellation - invoke terminates
// as defer we decrease wait counter
func (group *async) executeStep(ctx context.Context, cancel context.CancelFunc, step Step) {
	defer func() {
		group.mutex.Lock()

		// if we don't need to wait for flow execution - disable sync logic
		if group.wait {
			group.wg.Done() // release waiting
		}

		// NOTE: workers interface might be nil => no limits and no wait-release logic
		if group.workers != nil {
			group.workers.release() // release working resources. `worker`
			// TODO: group.workers.Push(worker) // release working resources. `worker`
		}

		group.mutex.Unlock()
	}()

	// check for incoming signal of uselessness of this function
	select {
	case <-ctx.Done():
		// context cancelled by another function
		// no need for starting execution of `fn`
	default:
		// Default is required to avoid blocking on select
		// we can start atomic function execution
		if err := step.Run(ctx); err != nil {
			if group.wait && !group.closed {
				group.errCh <- err
				cancel()
			}
		}
	}
}

// close closes group channels for r/w ops
func (group *async) close(cancel context.CancelFunc) {
	group.mutex.Lock()

	group.closed = true // block channels for read/write operations
	// NOTE: synchronization channels required ONLY if we want to wait for results
	// if delay mode - no need to create and close channels
	if group.wait {
		close(group.errCh)
		close(group.doneCh)
	}

	group.mutex.Unlock()

	// NOTE: context cancellation function might be nil - check for it
	if cancel != nil {
		cancel()
	}
}

func (group *async) Run(ctx context.Context) error {
	var cancel context.CancelFunc // NOTE: by default - nil

	// if we work in `delay` mode - no need to work with any kind of cancellation
	// let's check it!
	if group.wait {
		// create cancellation for current group
		// NOTE: for parent groups, there is a parent context, the cancellation of which here will also be tracked
		ctx, cancel = context.WithCancel(ctx)
		// Make sure it's called to release resources even if no errors
		defer group.close(cancel)
	}

	// iterate over steps and run goroutines
	// for {
	// 	// Phase 1. Get step
	// TODO: if group.steps == nil -> 'invalid memory address or nil pointer dereference'
	// 	step, ok := group.steps.Pop().(Step)
	// 	if !ok {
	// 		break
	// 	}
	for _, step := range group.steps {
		// Pre Phase. Checks
		// NOTE: step might be nil -> we need to check if it makes sense at all
		if step == nil {
			continue
		}

		// Phase 1. Get worker
		// NOTE: workers interface might be nil => no limits and no wait-release logic
		if group.workers != nil {
			group.workers.wait() // blocking operation
			// TODO: group.workers.Pop() // blocking operation
		}

		// Phase 2. Waiting counter
		// if we don't need to wait for flow execution - disable sync logic
		// backwards operation at `group.execute.defer`
		if group.wait {
			group.wg.Add(1)
		}

		// Phase 3. Run step in goroutine
		go group.executeStep(ctx, cancel, step)
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
		group.mutex.Lock()
		if !group.closed {
			group.doneCh <- struct{}{} // send complete signal to select below
		}
		group.mutex.Unlock()
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
