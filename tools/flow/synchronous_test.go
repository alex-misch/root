package flow

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"testing"
)

func TestSynchronous(t *testing.T) {
	var a, b, c int
	var bazErr = errors.New("Error from baz")

	var foo Step = Func(func(ctx context.Context) error {
		a = 1
		return nil
	})

	var bar Step = Func(func(ctx context.Context) error {
		b = 1
		return nil
	})

	var baz Step = Func(func(ctx context.Context) error {
		c = 1
		return bazErr
	})

	tableTests := []struct {
		steps    []Step
		err      error
		counters []int // slice of counter after execution in format {a, b, c}
	}{
		{[]Step{nil, nil, nil}, nil, []int{0, 0, 0}},    // run nils, nothing changes, just skip
		{[]Step{foo, baz, bar}, bazErr, []int{1, 0, 1}}, // 2 failed - error arrived
		{[]Step{baz, foo, bar}, bazErr, []int{0, 0, 1}}, // 1 failed - error arrived
		{[]Step{foo, bar}, nil, []int{1, 1, 0}},         // totally success case
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			// reset counters
			a, b, c = 0, 0, 0

			// just check returning error data
			if err := synchronous(context.TODO(), tt.steps...); tt.err != err {
				t.Fatalf("err: expected %q, got %q", tt.err, err)
			}

			// check counter on dummies
			if counters := []int{a, b, c}; !reflect.DeepEqual(counters, tt.counters) {
				t.Fatalf("counters: expected %q, got %q", tt.counters, counters)
			}
		})
	}
}
