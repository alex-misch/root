package flow

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"testing"
)

func TestTransaction(t *testing.T) {
	t.Run("New", func(t *testing.T) {
		// pseudo steps
		var up Step = &dummy{}
		var down Step = &dummy{}

		tableTests := []struct {
			up    Step
			down  Step
			final Step
		}{
			{nil, nil, nil},
			{nil, down, nil},
			{up, nil, up},
			{up, down, Transaction(up, down, false)},
		}
		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if final := Transaction(tt.up, tt.down, false); !reflect.DeepEqual(final, tt.final) {
					t.Fatalf("expected %q, got %q", tt.final, final)
				}
			})
		}
	})

	t.Run("Run", func(t *testing.T) {
		var a, b int
		var errUp = errors.New("Up error")
		var errDown = errors.New("Down error")
		// // pseudo steps
		var upSuccess Step = Func(func(ctx context.Context) error {
			a++
			return nil
		})
		var upError Step = Func(func(ctx context.Context) error {
			b++
			return errUp
		})
		var downSuccess Step = Func(func(ctx context.Context) error {
			a++
			return nil
		})
		var downError Step = Func(func(ctx context.Context) error {
			b++
			return errDown
		})

		tableTests := []struct {
			up    Step
			down  Step
			force bool
			err   error
		}{
			{nil, nil, false, ErrStepOrphan}, // up == nil (orphan)

			{upSuccess, nil, false, nil},          // up success (no force)
			{upSuccess, nil, true, nil},           // up success (force)
			{upSuccess, downSuccess, true, nil},   // up success (force with success)
			{upSuccess, downSuccess, false, nil},  // up success (no force with success)
			{upSuccess, downError, false, nil},    // up success (no force with error)
			{upSuccess, downError, true, errDown}, // up success (force with error)

			{upError, nil, false, errUp},         // up error, no down (no force)
			{upError, nil, true, errUp},          // up error, no down (force)
			{upError, downSuccess, false, errUp}, // up error, down success (no force)
			{upError, downError, false, errUp},   // up error, down error (no force)

			{upError, downSuccess, true, errUp}, // up error, down success (force)
			{upError, downError, true, errUp},   // up error, down error (force)
		}
		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				// reset counters
				a, b = 0, 0

				step := &transaction{tt.up, tt.down, tt.force}
				if err := step.Run(context.TODO()); err != tt.err {
					t.Fatalf("err: expected %q, got %q", tt.err, err)
				}
			})
		}
	})
}
