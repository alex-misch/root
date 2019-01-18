package flow

import (
	"context"
	"fmt"
	"strings"
)

// concurrent is group of container running in parallel (asynchronous)
type concurrent []Step

// Concurrent creates group of steps, running in parallel (concurrent)
// (just utility function)
func Concurrent(steps ...Step) Step {
	// filter unusable steps
	steps = normalize(steps...)

	switch len(steps) {
	// TODO: what? what empty response?
	case 0:
		return nil
	case 1: // there is single step, no need to group
		return steps[0]
	default: // many steps, grouping this
		return concurrent(steps)
	}
}

// Run implements Step interface
// just run one by one
func (steps concurrent) Run(ctx context.Context) error {
	// run asynchronous with waiting and without resource limits
	return newAsync(true, nil, steps...).Run(ctx)
	// return asynchronous(ctx, true, nil, steps...)
}

// String implements fmt.Stringer interface
func (steps concurrent) String() string {
	parts := make([]string, len(steps))

	for i, step := range steps {
		parts[i] = fmt.Sprintf("\t%s", step)
	}

	return fmt.Sprintf("CONCURRENT(\n%s\n)", strings.Join(parts, ",\n"))
}
