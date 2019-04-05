package flow2

import (
	"container/heap"
	"context"
	"sync"
)

const (
	G_DELAY      = 1 << iota // should we return control before everything is done
	G_CONCURRENT             // should we run each step in their own goroutine
)

// group is some kind of sandbox for running steps as a group
type group struct {
	mask byte

	workers heap.Interface
	steps   heap.Interface

	wg     sync.WaitGroup
	cancel context.CancelFunc // cancellation context for this group
	errCh  chan error         // channel for collecting errors
}

// newGroup(nil, nil, G_DELAY|G_CONCURRENT)
// func newGroup(steps, workers heap.Interface, mask byte) *group {
//
// }

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
	default:
		// default is required to avoid blocking on select
		// we can start atomic function execution
		// NOTE: here are no check for `step == nil` because this method invokes from loop where check exists
		if err := step.Run(ctx, nil, nil); err != nil {
			g.errCh <- err
			g.cancel()
			return err // TODO whaaat?
		}
	}

	return nil
}

// wait runs group "agent" function
// that waiting for complete group execution and closes resources
func (g *group) wait() error {
	defer g.Close()

	g.wg.Wait() // wait until all completed

	// Return value (error)
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
func (g *group) Run(ctx context.Context) error {
	// Pre phase. Checks
	if g.steps == nil {
		// nothing to run (empty heap)
		return nil
	}

	// create cancellation of this group
	ctx, g.cancel = context.WithCancel(ctx)

	// Main iteration loop throw available step
	// all .Pop() from heaps (steps or workers) might be blocking
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
		// worker's heap might be nil => unlimited resources
		if g.workers != nil {
			heap.Pop(g.workers) // wait for worker
		}

		// Phase 3. Run the `Step`
		// multiple modes available
		// delay concurrent
		// delay group ???????????
		// concurrent
		// group
		if g.mask&G_CONCURRENT != 0 {
			// run in own thread
			go g.runStep(ctx, step)
		} else {
			// run in current thread
			// TODO: what with g.Close()?
			if err := g.runStep(ctx, step); err != nil {
				return err
			}
		}
	}

	// Agent thread
	// waiting for complex execution and results
	if g.mask&G_DELAY != 0 {
		// delayed mode, no result returns, but agent works in background mode
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
	close(g.errCh)

	// Phase 2. Close execution context
	// NOTE: context cancellation function might be nil - check for it
	if g.cancel != nil {
		g.cancel()
	}

	return nil
}
