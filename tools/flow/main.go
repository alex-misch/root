package flow

import (
	"container/heap"
	"context"
	"errors"
	"os"
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

// Filer is interface to get underlying pollable file
// used for describing input and output of step
// for piping, logging
// it is something where we can store step's result
//
// TODO: Examples:
// File
// Pipe
// Logger
// Socket
type Filer interface {
	File() (*os.File, error)
}

// Step interface describes something that can be runned in some flow
type SStep interface {
	// stdin, stdout, stderr
	Run(context.Context, io.Reader, io.Writer, io.Writer) error
}
type Step interface {
	Run(context.Context) error
}

// execute is a universal runnner for all objects implements Step interface
// execute runs a step on behalf of a available worker
func execute(workers heap.Interface, ctx context.Context, step Step) error {
	if workers != nil {
		heap.Pop(workers)             // wait for available worker
		defer heap.Push(workers, nil) // return worker after a step is finished
	}

	// broadcast waiting steps
	// at inner subscription system
	defer Broadcast(step)

	// run the step
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
	// Pre Phase. NOTE: step might be nil -> we need to check if it makes sense at all
	if step == nil {
		return nil
	}

	return execute(nil, ctx, step)
}
