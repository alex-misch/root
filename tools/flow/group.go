package flow

import (
	"container/heap"
	"context"
	"fmt"
	"sync"
)

const (
	// Group runtime modifications.
	// Describes how we run the steps, how we handle the result, what context we use.
	R_CONCURRENT     uint8 = 1 << iota // Should we run each step in their own goroutine?
	W_BACKGROUND                       // Should we return control before everything is done?
	CTX_GROUP_ORPHAN                   // Detach current group context from a parent. Current tree will be independent.
	CTX_STEP_NEW                       // Detach step's context from current. All children will be independent.
)

// group describes multiple `Step` runned as a complex task.
// Contains several logic nodes:
//
// 1) Waiter. Describes how we will return results to caller.
// 2) Runner. Describes iteration loop and execution logic of steps heap.
// 3) getContext. Describes which context will each step receive to .Run() method.
//
// Also, there is group level context logic.
type group struct {
	flags uint8      // Modifications set.
	once  sync.Once  // Prepare group only once.
	mutex sync.Mutex // Protects variables below.

	workers heap.Interface
	steps   heap.Interface

	ctx    context.Context    // Group level context.
	cancel context.CancelFunc // Group level context cancellation.

	wg    sync.WaitGroup // Allows track that all steps are finished.
	errCh chan error     // Channel for collecting errors.
}

// NewGroup returns new group for `steps` execution.
// Uses flags for different running and waiting modifications.
// Most likely you should use predefined group creators like `Concurrent`, `Group`, etc.
func NewGroup(workers, steps heap.Interface, flags uint8) Step {
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

// has describes has the group's flags modification bit set.
func (g *group) has(bit uint8) bool {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	return g.flags&bit != 0
}

// prepare sets context cancellation for all group.
func (g *group) prepare(ctx context.Context) {
	// Function makes changes only once.
	g.once.Do(func() {
		// Check group independence from a caller's context.
		orphan := g.has(CTX_GROUP_ORPHAN)

		g.mutex.Lock()

		switch {
		case orphan:
			// If orphan mode enabled - always use new context.
			ctx = context.Background()
		case g.ctx != nil:
			// Context already set, ignore new one.
			ctx = g.ctx
		case ctx == nil:
			// New context is nil - create empty one.
			ctx = context.Background()
		}

		// Create group cancellation.
		ctx, cancel := context.WithCancel(ctx)

		// Save variables.
		g.ctx = ctx
		g.cancel = cancel

		g.mutex.Unlock()
	})
}

// Context returns actual context used for run step.
// Always return non-nil context.
func (g *group) Context() context.Context {
	// Get current context.
	g.mutex.Lock()
	ctx := g.ctx
	g.mutex.Unlock()

	// Check child is independent of the group's context.
	if g.has(CTX_STEP_NEW) || ctx == nil {
		// Step will use his own context.
		return context.Background()
	}

	// Step will use the group's context.
	return ctx
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
			// Run the `Step` in their own goroutine.
			go g.run(step)
		} else {
			// Run the `Step` in current goroutine.
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
	g.mutex.Lock()
	ch := g.errCh
	g.mutex.Unlock()

	// error to return
	var err error

	// Phase 1. Try to get result from channel.
	for {
		e, ok := <-ch
		// Result fetched.
		// Does we need to store this error for nearest return operation?
		if e != nil && err == nil {
			err = e
		}
		// Does we need to return access to caller?
		if !ok {
			// The case when the channel was closed.
			// Means g.Close() was invoked.
			// Means all steps were handled by the `runner`.
			// Nothing more will come => return access to a caller.
			return err
		}
	}
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
	// Use `.Context()` to fetch actual ctx for this step.
	ctx := g.Context()

	// Phase 2. Check the relevance of the data being run.
	select {
	case <-ctx.Done():
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

	// Phase 1. Close execution context.
	// Give to understand that execution no sense.
	if g.cancel != nil {
		g.cancel()
	}

	// Phase 2. Send information to `agent` if he is related
	if g.errCh != nil {
		// NOTE: operation in defer is not under mutex.Lock.
		// Because channel operations is safe itself.
		// In case when no receivers on channel locking mutex can hung.
		defer func(ch chan error) { ch <- err }(g.errCh)
	}

	g.mutex.Unlock()
}

// Run implements the flow.Step interface.
func (g *group) Run(ctx context.Context) error {
	// Prepare group.
	// 1) Set group's level context and cancellation.
	g.prepare(ctx)

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

	// Phase 1. Close execution context
	if g.cancel != nil {
		g.cancel()
	}

	// Phase 2. Close all synchronization channels
	if g.errCh != nil {
		close(g.errCh)
		g.errCh = nil
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
