package flow2

import (
	"container/heap"
	"context"
	"sync"
)

const (
	G_CONCURRENT uint8 = 1 << iota // should we run each step in their own goroutine
	G_DELAY                        // should we return control before everything is done
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
			g.errCh <- err
			g.cancel()
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
		// worker's heap might be nil => unlimited resources => no waiting here
		if g.workers != nil {
			heap.Pop(g.workers) // wait for worker
		}

		// Phase 3. Run the `Step`
		// multiple modes available
		// delay concurrent
		// delay group ???????????
		// concurrent
		// group
		if g.has(G_CONCURRENT) {
			// run in own thread
			go g.runStep(ctx, step)
		} else {
			// run in current thread
			if err := g.runStep(ctx, step); err != nil {
				// step failed, no need to move forward more
				break
			}
		}
	}

	// Agent thread
	// waiting for complex execution and results
	if g.has(G_DELAY) {
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
	if g.errCh != nil {
		close(g.errCh)
	}

	// Phase 2. Close execution context
	if g.cancel != nil {
		g.cancel()
	}

	return nil
}
