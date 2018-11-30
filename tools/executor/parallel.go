package executor

import (
	"context"
	"fmt"
	"strings"
)

// parallel is group of container running in parallel (asynchronous)
type parallel []Step

// NewParallel creates group of steps, running in parallel
// (just utility function)
func NewParallel(steps ...Step) Step {
	switch len(steps) {
	// TODO: what? what empty response?
	case 0:
		return nil
	case 1: // there is single step, no need to group
		return steps[0]
	default: // many steps, grouping this
		return parallel(steps)
	}
}

// Run implements Step interface
// just run one by one
func (steps parallel) Run(ctx context.Context) error {
	return concurrent(ctx, steps...)
}

// String implements fmt.Stringer interface
func (steps parallel) String() string {
	parts := make([]string, len(steps))

	for i, step := range steps {
		parts[i] = fmt.Sprintf("\t%s", step)
	}

	return fmt.Sprintf("PARALLEL(\n%s\n)", strings.Join(parts, ",\n"))
}
