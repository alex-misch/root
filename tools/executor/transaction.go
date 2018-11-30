package executor

import (
	"context"
)

// transaction is Step with rollback functionality in case of error
type transaction struct {
	up    Step // step to achieve the desired state
	down  Step // step to rollback to the initial state
	force bool // indicates that initial state must be rolled back anyway (even if no errors)
}

func NewTransaction(up, down Step, force bool) Step {
	// special case - if up and not down - there is no to rollback - no need to create transaction
	if down == nil {
		return up
	}

	// there is something to up and something to rollback, full transaction
	return &transaction{up, down, force}
}

// backward is small tool for rolling back
func (t *transaction) backward(ctx context.Context) error {
	if t.down != nil {
		return t.down.Run(ctx)
	}

	return nil
}

// Run implements Step interface
func (t *transaction) Run(ctx context.Context) error {
	if t.up != nil {
		// forward stage
		if err := t.up.Run(ctx); err != nil {
			t.backward(ctx) // forward movement failed, need to rollback
			return err      // but return error from run
		} else if t.force {
			return t.backward(ctx) // forward movement failed, need to rollback and return error from backward stage
		}
	}

	return nil
}
