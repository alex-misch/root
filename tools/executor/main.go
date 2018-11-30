package executor

import (
	"context"
	"errors"
)

var (
	// describing situation when step haven't got required context information about himself to run
	ErrStepOrphan = errors.New("executor: Step run without required context")
)

// Step interface describes somethink that can be runned in some flow
type Step interface {
	Run(context.Context) error
}
