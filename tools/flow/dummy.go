package flow

import (
	"context"
	"fmt"
)

// dummy is just test object, implementing Step interface
type dummy struct {
	counter int
	i       int
}

func Dummy(i int) Step {
	return &dummy{i: i}
}

// Run implements Step interface
// main simple idea - we try to get number from context, compare it with our i
// equal - succes
// otherwise - return error
// also, set invoke counter
func (step *dummy) Run(ctx context.Context) error {
	// increase counter
	defer func() {
		step.counter++
	}()

	if i, ok := ctx.Value("dummy").(int); ok {
		if i == step.i {
			// error case
			// return step, because it is error interface implements
			return fmt.Errorf("dummy: Error from %d", step.i)
		}
	}

	// all other cases - success
	return nil
}
