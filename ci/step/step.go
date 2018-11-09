package step

import (
	"context"
)

// Interface is interface describes somethink that can be runned in some flow
type Interface interface {
	Run(context.Context) error
	// NOTE: for wait analog step
	// Subscribe()
	// Unsubscribe()
}
