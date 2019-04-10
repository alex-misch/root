package flow

import (
	"context"
	"testing"
)

func TestProxyGroup(t *testing.T) {
	var flow Step

	flow = Group(nil,

		// First step, prepare all layers (prepare, down only if error occured)
		Transaction(
			Concurrent(nil,
				Group(nil, dummy(2), dummy(2)),
				Group(nil, dummy(2), dummy(2)),
				Group(nil, dummy(1), dummy(2)),
			),
			Concurrent(nil, dummy(2), dummy(2), dummy(2)),
			false,
		),

		// Second step, execute all layers concurrently (run, close anyway)
		Concurrent(nil, dummy(2), dummy(2), dummy(2)),
	)

	flow = Concurrent(nil,
		Group(nil, dummy(2), dummy(2)),
		Group(nil, dummy(2), dummy(2)),
		Group(nil, dummy(1), dummy(2)),
	)

	flow = Concurrent(nil,
		dummy(2), dummy(1), dummy(2),
	)

	t.Error(flow.Run(context.TODO()))

	// t.Run("", func(t *testing.T) {
	//
	// })

}
