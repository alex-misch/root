package flow

import (
	"context"
	"sync"
)

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

// execute is a single step invoсation from flow and cancel flow if error returns
// if error fetched through context cancellation - invoke terminates
func execute(step Step, errCh chan error, ctx context.Context, cancel context.CancelFunc) {
	// check for incoming signal of uselessness of this function
	select {
	case <-ctx.Done():
		// context cancelled by another function
		// no need for starting execution of `fn`
	default:
		// Default is must to avoid blocking
		// we can start atomic function execution
		if err := step.Run(ctx); err != nil {
			errCh <- err
			cancel()
		}
	}
}

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

// asynchronous is special tool that running steps concurrently
// error resolving by channels
// cancellation in case of error through context cancellation
// wait for completion through sync.WaitGroup
func asynchronous(ctx context.Context, wait bool, resources pool, steps ...Step) error {
	var wg sync.WaitGroup

	errCh := make(chan error, 1)
	ctx, cancel := context.WithCancel(ctx) // TODO: Is this a duplication of functionality in flow.Execute() ?

	// Make sure it's called to release resources even if no errors
	defer func() {
		close(errCh)
		cancel()
	}()

	for _, step := range steps {
		// Pre Phase. NOTE: step might be nil -> we need to check if it makes sense at all
		if step == nil {
			continue
		}

		// wait for resource
		// NOTE: resources interface might be nil => no limits and no wait-release logic
		if resources != nil {
			resources.wait()
		}

		// if we don't need to wait for flow execution - disable sync logic
		if wait {
			wg.Add(1)
		}

		// Main Phase, run goroutine for step execution
		// after execution release all resources if need
		go func(step Step) {
			defer func() {
				// if we don't need to wait for flow execution - disable sync logic
				if wait {
					wg.Done() // release waiting
				}

				// NOTE: resources interface might be nil => no limits and no wait-release logic
				if resources != nil {
					resources.release() // release working resources
				}
			}()

			execute(step, errCh, ctx, cancel) // single execution
		}(step)
	}

	// if we don't need to wait for flow execution - disable sync logic
	// NOTE: if delay - error not visible
	if wait {
		// wait until all completed
		wg.Wait() // TODO: hungs here if some function failed, but abother bocking - we need to skip this

		// handle errors from concurrent goroutines
		return errs(errCh)
	}

	// delay case
	return nil
}
