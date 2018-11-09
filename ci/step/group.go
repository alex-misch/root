package step

import (
	"context"
	"fmt"
	"strings"
)

// group is a group of steps running synchronous
type Group []Interface

// NewGroup creates group of steps
// (just utility function)
func NewGroup(steps ...Interface) Interface {
	// if multiple jobs - group them
	switch len(steps) {
	// TODO: what? what empty response?
	case 0:
		return nil
	case 1: // there is single step, no need to group
		return steps[0]
	default: // many steps, grouping this
		return Group(steps)
	}
}

// Run implements Step interface
// just run one by one
func (group Group) Run(ctx context.Context) error {
	for _, step := range group {
		if err := step.Run(ctx); err != nil {
			return err
		}
	}

	return nil
}

// String implements fmt.Stringer interface
func (group Group) String() string {
	parts := make([]string, len(group))

	for i, step := range group {
		parts[i] = fmt.Sprintf("%s", step)
	}

	return fmt.Sprintf("GROUP(\n%s\n)", strings.Join(parts, ",\n"))
}
