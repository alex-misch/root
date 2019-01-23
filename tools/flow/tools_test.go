package flow

import (
	"context"
	"fmt"
	"reflect"
	"testing"
)

func TestTools(t *testing.T) {
	t.Run("normalize", func(t *testing.T) {
		var foo Step = &dummy{}
		var bar Step = &dummy{}

		tableTests := []struct {
			in  []Step
			out []Step
		}{
			{nil, nil},
			{[]Step{}, nil},
			{[]Step{nil}, nil},
			{[]Step{nil, nil}, nil},
			{[]Step{nil, foo, nil, bar, nil}, []Step{foo, bar}},
		}
		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if out := normalize(tt.in...); !reflect.DeepEqual(out, tt.out) {
					t.Fatalf("expected %q, got %q", tt.out, out)
				}
			})
		}
	})

	t.Run("ToStep", func(t *testing.T) {
		// just function, that ca n be used as Step
		f := func(ctx context.Context) error {
			return nil
		}
		s := Func(func(ctx context.Context) error {
			return nil
		})

		tableTests := []struct {
			in   interface{}
			step Step
			err  error
		}{
			{nil, nil, ErrNotAStep},
			{"foobar", nil, ErrNotAStep},
			{f, Func(f), nil},
			{s, s, nil},
		}
		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				_, err := ToStep(tt.in)
				// if !reflect.DeepEqual(step, tt.step) {
				// 	t.Fatalf("expected %q, got %q", tt.step, step)
				// }
				if err != tt.err {
					t.Fatalf("expected %q, got %q", tt.err, err)
				}
			})
		}
	})
}
