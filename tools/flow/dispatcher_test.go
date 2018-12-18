package flow

import (
	"fmt"
	"reflect"
	"testing"
)

func TestDispatcher(t *testing.T) {
	t.Run("New", func(t *testing.T) {
		// pseudo steps
		var foo Step = &dummy{}
		var bar Step = &dummy{}
		var baz Step = &dummy{}

		// proxy types
		tableTests := []struct {
			steps   []Step
			workers int
			final   Step
		}{
			// zero cases
			{[]Step{nil}, 2, nil},
			{[]Step{nil, nil}, 2, nil},
			// single cases, just return incoming step
			{[]Step{foo}, 2, foo},
			{[]Step{foo}, 1, foo}, // NOTE: subcase not working here (len == 1 above)
			{[]Step{Concurrent(foo)}, 2, foo},
			// sub case with concurrent
			{[]Step{foo, bar}, 2, Concurrent(foo, bar)},
			{[]Step{foo, bar}, 3, Concurrent(foo, bar)},
		}
		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if final := Dispatcher(tt.workers, tt.steps...); !reflect.DeepEqual(final, tt.final) {
					t.Fatalf("expected %q, got %q", tt.final, final)
				}
			})
		}

		// real dispatcher case
		step := Dispatcher(2, foo, bar, baz)
		_, ok := step.(*dispatcher)

		if !ok {
			t.Fatal("step.(type) -> Expected *dispatcher")
		}

	})

	t.Run("String", func(t *testing.T) {
		tableTests := []struct {
			steps   []Step
			workers int
			s       string
		}{
			{nil, 0, "%!s(<nil>)"},
			{[]Step{}, 2, "%!s(<nil>)"},
			{[]Step{nil, nil}, 1, "%!s(<nil>)"},
			{[]Step{Dummy(1), Dummy(2), Dummy(5)}, 3, "CONCURRENT(\n\tDUMMY(1),\n\tDUMMY(2),\n\tDUMMY(5)\n)"},
			{[]Step{Dummy(1), Dummy(2), Dummy(5)}, 4, "CONCURRENT(\n\tDUMMY(1),\n\tDUMMY(2),\n\tDUMMY(5)\n)"},
			{[]Step{Dummy(1), nil, Dummy(5)}, 1, "DISPATCHER(\n\tDUMMY(1),\n\tDUMMY(5)\n)"},
		}
		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if s := fmt.Sprintf("%s", Dispatcher(tt.workers, tt.steps...)); s != tt.s {
					t.Fatalf("expected %q, got %q", tt.s, s)
				}
			})
		}
	})
}
