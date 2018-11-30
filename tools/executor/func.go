package executor

import (
	"context"
)

// Func is basic type of step (executable)
// just wrapper for function that implements Step interface
type Func func(context.Context) error

// Run implements Step interface
func (f Func) Run(ctx context.Context) error {
	return f(ctx)
}
