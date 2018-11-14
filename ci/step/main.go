package step

import (
	"context"
)

// Run is universal runnner for all objects implements step.Interface
// Main idea is creating shared context with timeout and cancel functionality
func Run(step Interface) error {
	// Phase 1. Create context with cancel functionality
	// and proxy information about high level modules to low level
	// integration purpose
	// because each level does not know the context in which it is running
	ctx, cancel := context.WithCancel(context.Background())
	// always cancel the context on return (in error case they will cancel any job)
	defer cancel()

	// run the step
	return step.Run(ctx)
}
