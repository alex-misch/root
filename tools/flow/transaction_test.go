package flow

import (
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
}
