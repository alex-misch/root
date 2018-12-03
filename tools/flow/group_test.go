package flow

import (
	"fmt"
	"reflect"
	"testing"
)

func TestGroup(t *testing.T) {
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
			{[]Step{Group()}, nil},
			{[]Step{Group(Group())}, nil},
			{[]Step{nil, nil, nil}, nil},
			{[]Step{nil, Group(), nil, Group(Group())}, nil},
			// single cases, just return incoming step
			{[]Step{foo}, foo},
			{[]Step{Group(foo)}, foo},
			{[]Step{Group(Group(foo))}, foo},
			// usual cases
			{[]Step{bar, baz}, Group(bar, baz)},
			{[]Step{bar, nil, baz, nil, nil}, Group(bar, baz)},
		}
		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if final := Group(tt.steps...); !reflect.DeepEqual(final, tt.final) {
					t.Fatalf("expected %q, got %q", tt.final, final)
				}
			})
		}
	})
}
