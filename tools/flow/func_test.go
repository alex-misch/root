package flow

import (
	"context"
	"fmt"
	"testing"
	// "reflect"
)

func finner(ctx context.Context) error {
	return nil
}

func TestFunc(t *testing.T) {
	t.Run("New", func(t *testing.T) {
		tableTests := []struct {
			inner func(context.Context) error // raw function
			isNil bool
		}{
			{nil, true},
			{finner, false},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if step := Func(tt.inner); tt.isNil && (step != nil) {
					t.Fatalf("step: Expected %v, got %q", nil, step)
				} else if !tt.isNil && (step == nil) {
					t.Fatalf("step: Expected %q, got %v", "<Step>", nil)
				}
			})
		}
	})
}
