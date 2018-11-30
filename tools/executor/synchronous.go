package executor

import (
	"context"
)

// Set of tools for synchronous (step by step) flow running

// just step by step execution
func synchronous(ctx context.Context, steps ...Step) error {
	for _, step := range steps {
		if err := step.Run(ctx); err != nil {
			return err
		}
	}

	return nil
}
