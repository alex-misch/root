package flow

import (
	"context"
	"errors"
	"fmt"
	"testing"
)

func TestMain(t *testing.T) {
	t.Run("execute", func(t *testing.T) {
		var err error = errors.New("Some error")

		tableTests := []struct {
			step Step
			err  error
		}{
			{nil, nil},
			{Func(func(ctx context.Context) error { return nil }), nil},
			{Func(func(ctx context.Context) error { return err }), err},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if err := Execute(tt.step); tt.err != err {
					t.Fatalf("err: expected %q, got %q", tt.err, err)
				}
			})
		}
	})
}
