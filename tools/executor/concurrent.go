package executor

import (
	"context"
	"sync"
)

// Set of tools for concurrent flow running

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

// concurrent is special tool that running steps asynchronous (concurrent)
// error resolving by channels
// cancellation in case of error through context cancellation
// wait for completion through sync.WaitGroup
func concurrent(ctx context.Context, steps ...Step) error {
	var wg sync.WaitGroup

	errCh := make(chan error, 1)
	ctx, cancel := context.WithCancel(ctx)

	// Make sure it's called to release resources even if no errors
	defer func() {
		close(errCh)
		cancel()
	}()

	for _, step := range steps {
		wg.Add(1)

		go func(step Step) {
			execute(step, errCh, ctx, cancel) // single execution
			wg.Done()                         // release waiting
		}(step)
	}

	// wait until all completed
	wg.Wait()

	// handle errors from concurrent goroutines
	return errs(errCh)
}
