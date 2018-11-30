package executor

import (
	"context"
)

// Interface is interface describes somethink that can be runned in some flow
type Step interface {
	Run(context.Context) error
}

// OperationFunc is basic type of step (executable)
type OperationFunc func(context.Context) error

// Run implements Step interface
func (f OperationFunc) Run(ctx context.Context) error {
	return f(ctx)
}
