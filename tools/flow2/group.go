package flow2

import (
	"container/heap"
	"context"
	"sync"
)

const (
	R_CONCURRENT uint8 = 1 << iota // should we run each step in their own goroutine
	W_DELAY                        // should we return control before everything is done
)

// group is some kind of sandbox for running steps as a group
type group struct {
	flags uint8

	workers heap.Interface
	steps   heap.Interface

	wg     sync.WaitGroup
	cancel context.CancelFunc // cancellation context for this group
	errCh  chan error         // channel for collecting errors
}

// concurrent is a type of runner with own gorouitne for each step
func (g *group) concurrent(ctx context.Context) {
	for {
		// Phase 1. Get step and check for nil value (means end of chain, close loop)
		step, ok := heap.Pop(g.steps).(Step)
		if !ok {
			// no step available - end of chain
			break
		}

		// Step arrived, increment waiting counter
		g.wg.Add(1)

		// Phase 2. Get worker
		// worker's heap might be nil => unlimited resources => no waiting here
		if g.workers != nil {
			heap.Pop(g.workers) // wait for worker
		}

		// Phase 3. Run the `Step`
		go g.runStep(ctx, step)
	}
}

// sequence is a type of runner with step-by-step step invoking
func (g *group) sequence(ctx context.Context) {
	for {
		// Phase 1. Get step and check for nil value (means end of chain, close loop)
		step, ok := heap.Pop(g.steps).(Step)
		if !ok {
			// no step available - end of chain
			break
		}

		// Step arrived, increment waiting counter
		g.wg.Add(1)

		// Phase 2. Get worker
		// worker's heap might be nil => unlimited resources => no waiting here
		if g.workers != nil {
			heap.Pop(g.workers) // wait for worker
		}

		// Phase 3. Run the `Step`
		if err := g.runStep(ctx, step); err != nil {
			// step failed, no need to move forward more
			break
		}
	}
}

// newGroup returns new group of steps
// using flags for different running and waiting modifications
func newGroup(steps, workers heap.Interface, flags uint8) *group {
	return &group{
		steps:   steps,
		workers: workers,
		flags:   flags,
	}
}

// has describes has the group's flags modification bit set
func (g *group) has(bit uint8) bool {
	return g.flags&bit != 0
}

// closeStep releases all resources occupied by the `Step` object
func (g *group) closeStep() {
	// Phase 1. Return worker
	// worker's heap might be nil
	if g.workers != nil {
		heap.Push(g.workers, nil)
	}

	// Phase 2. Decrement waiting counter
	g.wg.Done()
}

// runStep just simple run `Step` object
func (g *group) runStep(ctx context.Context, step Step) error {
	defer g.closeStep()

	// check the relevance of the data being run
	select {
	case <-ctx.Done():
		// context cancelled by another function
		// no need for starting execution of `step`
		return ctx.Err()
	default:
		// default is required to avoid blocking on select
		// we can start atomic function execution
		// NOTE: here are no check for `step == nil` because this method invokes from loop where check exists
		if err := step.Run(ctx, nil, nil); err != nil {
			// oops, we have failed step
			// Phase 1. Send information to `agent` if he is related
			if g.errCh != nil {
				g.errCh <- err
			}
			// Phase 2. Close execution context
			// give to understand that execution no sense
			if g.cancel != nil {
				g.cancel()
			}

			// Phase 3. Return error to `runner`
			// caller can be stopped or something another logic if error
			return err
		}
	}

	return nil
}

// wait runs group "agent" function
// that waiting for complete group execution and closes resources
func (g *group) wait() error {
	defer g.Close()

	// wait until all completed
	g.wg.Wait()

	// Return value (fitrst available error from channel)
	select {
	case err := <-g.errCh:
		// error arrived from channel
		return err
	default:
		// Default is must be to avoid blocking
		return nil
	}
}

// Run runs group of steps
func (g *group) Run(ctx context.Context, input Filer, output Filer) error {
	// Pre phase. Checks and preparings
	if g.steps == nil {
		// nothing to run (empty heap)
		return nil
	}
	// create cancellation of this group
	ctx, g.cancel = context.WithCancel(ctx)

	// Phase 1. Get `runner`
	// runner is loop iterating logic
	if g.has(R_CONCURRENT) {
		g.concurrent(ctx)
	} else if g.has(W_DELAY) {
		go g.sequence(ctx)
	} else {
		g.sequence(ctx)
	}

	// Phase 2. Get `waiter`
	// waiter is waiting results logic
	if g.has(W_DELAY) {
		// delayed mode, no result returns, but waiting `agent` works in background mode
		go g.wait()
		return nil
	} else {
		// we need to take results and return it
		// as return error we will take first error from channel
		return g.wait()
	}
}

// Close implemtns io.Closer interface
// closes all group level resources
func (g *group) Close() error {
	// Phase 1. Close all synchronization channels
	if g.errCh != nil {
		close(g.errCh)
	}

	// Phase 2. Close execution context
	if g.cancel != nil {
		g.cancel()
	}

	return nil
}
