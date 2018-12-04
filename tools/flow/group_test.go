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

	t.Run("String", func(t *testing.T) {
		tableTests := []struct {
			steps []Step
			s     string
		}{
			{nil, "%!s(<nil>)"},
			{[]Step{}, "%!s(<nil>)"},
			{[]Step{Dummy(1), Dummy(2), Dummy(5)}, "GROUP(\n\tDUMMY(1),\n\tDUMMY(2),\n\tDUMMY(5)\n)"},
			{[]Step{Dummy(1), nil, Dummy(5)}, "GROUP(\n\tDUMMY(1),\n\tDUMMY(5)\n)"},
		}
		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if s := fmt.Sprintf("%s", Group(tt.steps...)); s != tt.s {
					t.Fatalf("expected %q, got %q", tt.s, s)
				}
			})
		}
	})
}
