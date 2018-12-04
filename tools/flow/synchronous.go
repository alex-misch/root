package flow

import (
	"context"
)

// Set of tools for synchronous (step by step) flow running

// synchronous is tool for step by step execution of Steps)
func synchronous(ctx context.Context, steps ...Step) error {
	for _, step := range steps {
		// Pre Phase. NOTE: step might be nil -> we need to check if it makes sense at all
		if step == nil {
			continue
		}

		if err := step.Run(ctx); err != nil {
			return err
		}
	}

	return nil
}
