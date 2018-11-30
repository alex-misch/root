package executor

import (
	"context"
	"fmt"
	"strings"
)

// Parallel is group of container running in parallel (asynchronous)
type Parallel []Step

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
		return Parallel(steps)
	}
}

// Run implements Step interface
// just run one by one
func (group Parallel) Run(ctx context.Context) error {
	return concurrent(ctx, group...)
}

// String implements fmt.Stringer interface
func (group Parallel) String() string {
	parts := make([]string, len(group))

	for i, step := range group {
		parts[i] = fmt.Sprintf("\t%s", step)
	}

	return fmt.Sprintf("PARALLEL(\n%s\n)", strings.Join(parts, ",\n"))
}
