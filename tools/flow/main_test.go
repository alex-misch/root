package flow

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"sync"
	"testing"
)

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
