// Package flow provides primitives for running some 'tasks'
// main idea: there is always something that can be done (`Step` interface)
// there are also resources (some abstract 'workers')
// package provides combintation of tools for running
// 1) how much we want to allocate resources for execution
// 2) do we want to wait for the result
// 3) timeout and cancellation functionality for all nested flow

// TODO: based on first two we need some heaps for Step's and Resources (with blocking .Pop())
package flow

import (
	"context"
	"errors"
)

var (
	// describing situation when Step haven't got required context
	// or some another information about himself to run
	// in other words - improperly configured step
	ErrStepOrphan = errors.New("tools/flow: Step run without required context")
	// when something failed to cast to Step interface
	ErrNotAStep = errors.New("tools/flow: Object cannot be used as `Step` interface")
)

// Step interface describes somethink that can be runned in some flow
type Step interface {
	Run(context.Context) error
}

// pool is interface for control the number of simultaneous goroutines
// using in `asynchronous`
type pool interface {
	wait()    // wait for free resource available
	release() // return resource back to pool
}

// Execute is universal runnner for all objects implements Step interface
// Main idea is creating shared context with timeout and cancel functionality
func Execute(step Step) error {
	// Pre Phase. NOTE: step might be nil -> we need to check if it makes sense at all
	if step == nil {
		return nil
	}

	// Phase 1. Create context with cancel functionality
	// and proxy information about high level modules to low level
	// integration purpose
	// because each level does not know the context in which it is running
	ctx, cancel := context.WithCancel(context.Background())
	// TODO: timeouts and other mechanics of cancellation
	// always cancel the context on return (in error case they will cancel any job)
	defer cancel()

	// run the step
	return step.Run(ctx)
}

// ExecuteWithContext is universal runnner for all objects implements Step interface
// unnecessary nonsense to avoid copy a check for a non-nil step
func ExecuteWithContext(ctx context.Context, step Step) error {
	// Pre Phase. NOTE: step might be nil -> we need to check if it makes sense at all
	if step == nil {
		return nil
	}

	return step.Run(ctx)
}
