package flow

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"testing"
)

func TestSynchronous(t *testing.T) {
	tableTests := []struct {
		steps    []Step
		i        int // failed number
		err      error
		counters []int // slice of counter after execution
	}{
		{ // 2 failed - error arrived
			[]Step{Dummy(1), Dummy(2), Dummy(3)}, 2, errors.New("dummy: Error from 2"), []int{1, 1, 0}, // second step not invoked, because first failed
		},
		{ // 1 failed - error arrived
			[]Step{Dummy(1), Dummy(2)}, 1, errors.New("dummy: Error from 1"), []int{1, 0}, // second step not invoked, because first failed
		},
		{ // totally success case
			[]Step{Dummy(1), Dummy(2)}, 100500, nil, []int{1, 1},
		},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			// create context
			ctx := context.WithValue(context.Background(), "dummy", tt.i)
			// just check returning error data
			if err := synchronous(ctx, tt.steps...); tt.err != nil {
				// we expecting error
				if err.Error() != tt.err.Error() {
					t.Fatalf("err: expected %q, got %q", tt.err, err)
				}
			} else if err != tt.err {
				// we do not expecting error, just check
				t.Fatalf("err: expected %q, got %q", tt.err, err)
			}

			// check counter on dummies
			counters := make([]int, len(tt.steps))
			for i, step := range tt.steps {
				counters[i] = step.(*dummy).counter
			}

			if !reflect.DeepEqual(counters, tt.counters) {
				t.Fatalf("counters: expected %q, got %q", tt.counters, counters)
			}
		})
	}
}
