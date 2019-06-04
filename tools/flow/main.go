package flow

import (
	"container/heap"
	"context"
	"errors"
	"io"
)

var (
	// describing situation when Step haven't got required context
	// or some another information about himself to run
	// in other words - improperly configured step
	ErrStepOrphan = errors.New("tools/flow: Step ran without required context")
	// when something failed to cast to Step interface
	ErrNotAStep = errors.New("tools/flow: Object cannot be used as `Step` interface")
)

// Step interface describes something that can be runned in some flow
type SStep interface {
	// stdin, stdout, stderr
	Run(context.Context, io.Reader, io.Writer, io.Writer) error
}
type Step interface {
	Run(context.Context) error
}

// execute is a universal runnner for any object implements the `Step` interface.
// execute describes full execution flow of the single step.
func execute(workers heap.Interface, ctx context.Context, step Step) error {
	// Pre Phase. NOTE: step might be nil -> we need to check if it makes sense at all
	if step == nil {
		return nil
	}

	// Phase 1. Enable or not workers mode.
	if workers != nil {
		heap.Pop(workers)             // wait for available worker
		defer heap.Push(workers, nil) // return worker after a step is finished
	}

	// Phase 2. Step exists, resources exists, run!
	// After execution - broadcast waiting nodes at inner subscription system
	defer Broadcast(step)

	// Run the step
	return step.Run(ctx)
}

// Execute is universal runnner for all objects implements Step interface
// Main idea is creating shared context with timeout and cancel functionality
// NOTE: context cancellation support parent closing therefore nested .WithCancel() - normal
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
	return execute(nil, ctx, step)
}

// ExecuteWithContext is universal runnner for all objects implements Step interface
// unnecessary nonsense to avoid copy a check for a non-nil step
func ExecuteWithContext(ctx context.Context, step Step) error {
	return execute(nil, ctx, step)
}
