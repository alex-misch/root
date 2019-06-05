package flow

import (
	"container/heap"
	"context"
	"fmt"
	"reflect"
	"sync"
)

const (
	// Runner modes. How we run steps from heap?
	R_CONCURRENT uint8 = 1 << iota // Should we run each step in their own goroutine.
	W_BACKGROUND                   // Should we return control before everything is done.
	W_INFINITY                     // Serve forever (no return in selector).
	CTX_ORPHAN                     // Detach current group context from parent.
	CTX_SEPARATE                   // Indicates that each step have their own context.
)

// group describes multiple `Step` runned as a complex task.
// Contains several logic nodes:
//
// 1) Waiter. Describes how we will return results to caller.
// 2) Runner. Describes iteration loop and execution logic of steps heap.
// 3) Contexter. Describes which context will each step receive to .Run() method.
//
// Also, there is group level context logic.
type group struct {
	flags uint8      // Modifications set.
	mutex sync.Mutex // Protects variables below.

	workers heap.Interface
	steps   heap.Interface

	ctx    context.Context    // Group level context.
	cancel context.CancelFunc // Group level context cancellation

	wg    sync.WaitGroup // Allows track that all steps are finished.
	errCh chan error     // Channel for collecting errors.
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

	// if g.has(CTX_ORPHAN) {
	// 	ctx = context.Background()
	// }

	ctx, cancel := context.WithCancel(context.Background())

	g.mutex.Lock()
	g.ctx = ctx
	g.cancel = cancel
	g.mutex.Unlock()
}

// runner is the helper function which run all steps from heap.
func (g *group) runner() {
	// Prephase. All steps finished, close the group execution.
	// Waiter routine will handle this action and return actual error value.
	defer g.Close()

	// Phase 1. Iterate over all steps. May work as `serve forever`.
	for {
		step, ok := heap.Pop(g.steps).(Step)
		if !ok {
			// No valid step available - end of chain.
			// The only way to brak the loop.
			break
		}

		// Step arrived, increase waiting counter.
		g.mutex.Lock()
		g.wg.Add(1)
		g.mutex.Unlock()

		// Look at runner mode enabled. And run `sub-run` function with the step.
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

	// Phase 2. Wait for all `sub-run` functions executed
	g.wg.Wait()
}

// waiter waits for execution results.
// Also returns access to caller via returned error.
func (g *group) waiter() error {
	// Phase 1. Try to get result from channel.
	for {
		err := <-g.errCh

		// Result fetched. does we need to return access to caller?
		if !g.has(W_BACKGROUND) && g.has(W_INFINITY) {
			// TODO: maybe log?
			continue
		}

		// No need to store this routine, return result to caller.
		return err
	}
}

// contexter returns actual context used for run step.
// based on CTX flags we can return new context or set some common cancellation.
func (g *group) contexter() context.Context {

	// if g.has(CTX_SEPARATE) {
	if true {
		// caller must use thie own version of ctx
		ctx := context.Background()
		fmt.Println("return new ctx because CTX_SEPARATE", reflect.ValueOf(ctx).Pointer())
		return ctx
	}

	g.mutex.Lock()
	defer g.mutex.Unlock()

	return g.ctx
}

// run runs single `Step` object in context of whole group.
func (g *group) run(step Step) error {
	// Prephase. Release it when finished
	defer func() {
		g.mutex.Lock()
		g.wg.Done()
		g.mutex.Unlock()
	}()

	// Phase 1. Prepare execution context.
	// Use `contexter` to fetch actual ctx for this step.
	// ctx := g.contexter()
	ctx := context.Background()

	// Phase 2. Check the relevance of the data being run.
	select {
	case <-ctx.Done():
		fmt.Println("CTX CLOSED")
		// Context cancelled by another `Step` in current group.
		// No need for starting execution of this step.
		return ctx.Err()
	default:
		// default is required to avoid blocking on select.
	}

	// Phase 3. We can start atomic function execution.
	// Run throught the universal step exectution tool.
	err := execute(g.workers, ctx, step)
	if err != nil {
		// Oops, step failed, set group to `failed` state.
		g.fail(err)
	}

	return err
}

// fail stops group execution with provided error.
func (g *group) fail(err error) {
	g.mutex.Lock()

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
}

// Run implements the flow.Step interface.
func (g *group) Run(ctx context.Context) error {
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
