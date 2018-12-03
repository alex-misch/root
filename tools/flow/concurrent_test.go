package flow

import (
	"fmt"
	"reflect"
	"testing"
)

func TestConcurrent(t *testing.T) {
	t.Run("New", func(t *testing.T) {
		// pseudo steps
		var foo Step = &dummy{}
		var bar Step = &dummy{}
		var baz Step = &dummy{}

		tableTests := []struct {
			steps []Step
			final Step
		}{
			// zero cases
			{[]Step{nil}, nil},
			{[]Step{Concurrent()}, nil},
			{[]Step{Concurrent(Concurrent())}, nil},
			{[]Step{nil, nil, nil}, nil},
			{[]Step{nil, Concurrent(), nil, Concurrent(Concurrent())}, nil},
			// single cases, just return incoming step
			{[]Step{foo}, foo},
			{[]Step{Concurrent(foo)}, foo},
			{[]Step{Concurrent(Concurrent(foo))}, foo},
			// usual cases
			{[]Step{bar, baz}, Concurrent(bar, baz)},
			{[]Step{bar, nil, baz, nil, nil}, Concurrent(bar, baz)},
		}
		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if final := Concurrent(tt.steps...); !reflect.DeepEqual(final, tt.final) {
					t.Fatalf("expected %q, got %q", tt.final, final)
				}
			})
		}
	})
}
