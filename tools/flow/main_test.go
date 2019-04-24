package flow

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"sync"
	"testing"
)

// func TestCircleHanging(t *testing.T) {
// 	workers := WorkersHeap(3) // only 3 workers across all nested groups
// 	step := Func(func(ctx context.Context) error { return nil })
//
// 	var step1 Step = Group(workers, step, step)
// 	var step2 Step = Func(func(ctx context.Context) error {
// 		WaitFor(step1)
// 		return nil
// 	})
// 	var step3 Step = Func(func(ctx context.Context) error {
// 		WaitFor(step2)
// 		return nil
// 	})
//
// 	// total flow
// 	var flow Step = Concurrent(
// 		workers,
// 		step1, step2, step3,
// 	)
//
// 	// with proper way of fetching workers this method must not hung!
// 	if err := Execute(flow); err != nil {
// 		t.Fatal(err)
// 	}
// }

func TestMain(t *testing.T) {
	var err error = errors.New("Some error")
	var stepSuccess Step = Func(func(ctx context.Context) error { return nil })
	var stepError Step = Func(func(ctx context.Context) error { return err })

	t.Run("Execute", func(t *testing.T) {
		tableTests := []struct {
			step Step
			err  error
		}{
			{nil, nil},
			{stepSuccess, nil},
			{stepError, err},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if err := Execute(tt.step); tt.err != err {
					t.Fatalf("err: expected %q, got %q", tt.err, err)
				}
			})
		}
	})

	t.Run("ExecuteWithContext", func(t *testing.T) {
		tableTests := []struct {
			step Step
			err  error
		}{
			{nil, nil},
			{stepSuccess, nil},
			{stepError, err},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if err := ExecuteWithContext(context.TODO(), tt.step); tt.err != err {
					t.Fatalf("err: expected %q, got %q", tt.err, err)
				}
			})
		}
	})

	t.Run("execute", func(t *testing.T) {
		subscribers = nil

		execute(nil, context.TODO(), stepSuccess)
		execute(nil, context.TODO(), stepError)

		expected := map[Step]*sync.Cond{
			stepSuccess: nil,
			stepError:   nil,
		}

		if !reflect.DeepEqual(expected, subscribers.pending) {
			t.Fatalf("expected %v, got %v", expected, subscribers.pending)
		}
	})
}
