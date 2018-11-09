package types

import (
	"context"
)

// Step is interface describes somethink that can be runned in some flow
type Step interface {
	Run(context.Context) error
	// NOTE: for wait analog step
	// Subscribe()
	// Unsubscribe()
}
