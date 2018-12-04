package flow

import (
	"context"
	"errors"
)

var (
	// describing situation when step haven't got required context
	// or some another information about himself to run
	// in other words - improperly configured step
	ErrStepOrphan = errors.New("flow: Step run without required context")
)

// Step interface describes somethink that can be runned in some flow
type Step interface {
	Run(context.Context) error
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
