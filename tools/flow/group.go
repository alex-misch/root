package flow

import (
	"container/heap"
	"context"
	"fmt"
	"sync"
)

const (
	// Runner modes. How we run steps from heap?
	R_CONCURRENT uint8 = 1 << iota // Should we run each step in their own goroutine.
	// Waiter modes. How we will wait for group results?
	W_BACKGROUND // Should we return control before everything is done.
	W_INFINITY   // Serve forever (no return in selector).
	// Context modes. How we will work with cancellation?
	CTX_ORPHAN   // Detach current group context from parent.
	CTX_SEPARATE // Indicates that each step have their own context.
)

// group describes multiple `Step` runned as a complex task.
// Contains several logic nodes:
//
// 1) Waiter. Describes how we will return results to caller.
// 2) Runner. Describes iteration loop and execution logic of steps heap.
// 3) Controller. Describes how we need return access to caller.
// 4) Contexter. Describes which context will each step receive to .Run() method.
//
// Also, there is group level context logic.
type group struct {
	flags uint8      // modifications set
	mutex sync.Mutex // protect variables below

	workers heap.Interface
	steps   heap.Interface

	ctx    context.Context    // group level context
	cancel context.CancelFunc // group level context cancellation

	// wg     sync.WaitGroup // responsible for waiting that all the steps are finished
	errCh  chan error    // channel for collecting errors
	doneCh chan struct{} // channel indicates all groups step completes
}

// newGroup returns new group of steps
// using flags for different running and waiting modifications
func newGroup(steps, workers heap.Interface, flags uint8) *group {
	// Pre phase. Checks and preparings
	if steps == nil {
		// nothing to run (empty heap)
		return nil
	}

	return &group{
		flags:   flags,
		workers: workers,
		steps:   steps,
		doneCh:  make(chan struct{}, 1),
		errCh:   make(chan error),
	}
}

// has describes has the group's flags modification bit set
func (g *group) has(bit uint8) bool {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	return g.flags&bit != 0
}

// setContext sets context cancellation for all group
func (g *group) setContext(ctx context.Context) {

	if g.has(CTX_ORPHAN) {
		ctx = context.Background()
	}

	ctx, cancel := context.WithCancel(ctx)

	g.mutex.Lock()
	g.ctx = ctx
	g.cancel = cancel
	g.mutex.Unlock()
}

// runner is the helper function which run all steps from heap.
func (g *group) runner() {
	defer func() {
		g.mutex.Lock()
		if g.doneCh != nil {
			g.doneCh <- struct{}{} // send complete signal
		}
		g.mutex.Unlock()
	}()

	for {
		step, ok := heap.Pop(g.steps).(Step)
		if !ok {
			// No valid step available - end of chain.
			// The only way to brak the loop.
			break
		}

		// Look at runner mode enabled.
		if g.has(R_CONCURRENT) {
			// Run the `Step` in their own goroutine
			go g.run(step)
		} else {
			// Run the `Step` in current goroutine
			if err := g.run(step); err != nil {
				// Step failed, no need to move forward more.
				break
			}
		}
	}
}

// waiter waits for execution results.
// Also returns access to caller via returned error.
func (g *group) waiter() error {
	for {
		// wait and return error to caller
		select {
		case err := <-g.errCh:
			// error arrived from channel
			if g.has(W_INFINITY) {
				// maybe log?
				continue
			}
			return err
		case <-g.doneCh:
			select {
			case err := <-g.errCh:
				// error arrived from channel
				if g.has(W_INFINITY) {
					// maybe log?
					continue
				}
				return err
			default:
				// Default is must be to avoid blocking
				if g.has(W_INFINITY) {
					// maybe log?
					continue
				}
				return nil
			}
		}
	}
}

// contexter returns actual context used for run step.
// based on CTX flags we can return new context or set some common cancellation.
func (g *group) contexter() context.Context {

	if g.has(CTX_SEPARATE) {
		// caller must use thie own version of ctx
		return context.Background()
	}

	g.mutex.Lock()
	defer g.mutex.Unlock()

	return g.ctx
}

// run runs single `Step` object in context of whole group.
func (g *group) run(step Step) error {
	// Phase 1. Use `contexter` for fetch actual ctx for step.
	ctx := g.contexter()

	// Phase 2. Check the relevance of the data being run.
	select {
	case <-ctx.Done():
		// context cancelled by another `Step` in group
		// no need for starting execution of this step
		return ctx.Err()
	default: // default is required to avoid blocking on select.
		// We can start atomic function execution.
		// Run throught the universal step exectution tool.
		if err := execute(g.workers, ctx, step); err != nil {
			g.mutex.Lock()
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
			g.mutex.Unlock()

			// Phase 3. Return error to `runner`.
			return err
		}
	}

	return nil
}

// Run implements the flow.Step interface.
func (g *group) Run(ctx context.Context) error {
	// Sure garbage will be collected.
	defer g.Close()

	// Prepare group level context and cancellation.
	g.setContext(ctx)

	// Run system goroutines with step runner and response waiter.
	go g.runner()

	// Section below describes returning control access to caller.
	if g.has(W_BACKGROUND) {
		// Background mode - return control to caller immediately.
		go g.waiter()
		return nil
	} else {
		// Foreground mode - wait for group closed.
		return g.waiter()
	}
}

// Close implements the io.Closer interface
// closes all group level resources
func (g *group) Close() error {
	g.mutex.Lock()

	// Phase 1. Close all synchronization channels
	if g.errCh != nil {
		close(g.errCh)
		g.errCh = nil
	}
	if g.doneCh != nil {
		close(g.doneCh)
		g.doneCh = nil
	}

	// Phase 2. Close execution context
	if g.cancel != nil {
		g.cancel()
	}

	g.mutex.Unlock()

	return nil
}

// String implements the fmt.Stringer interface.
func (g *group) String() string {
	if g.has(R_CONCURRENT) {
		return fmt.Sprintf("Concurrent(background=%t)", g.has(W_BACKGROUND))
	} else {
		return fmt.Sprintf("Group(background=%t)", g.has(W_BACKGROUND))
	}
}
