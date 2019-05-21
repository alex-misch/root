package flow

import (
	"context"
	"fmt"
	"reflect"
	"sync"
	"testing"
)

func TestSubscription(t *testing.T) {
	var a Step = Func(func(ctx context.Context) error { return nil })
	var b Step = Func(func(ctx context.Context) error { return nil })
	var c Step = Func(func(ctx context.Context) error { return nil })

	t.Run("hasheable", func(t *testing.T) {
		// main idea of this test - just add steps as key and get no errors
		m := make(map[Step]struct{}, 0)

		tableTests := []Step{
			a,
			Concurrent(nil, a, b, c),
			DelayConcurrent(nil, a, b),
			Group(nil, a, b, c),
			DelayGroup(nil, b, c),
			Transaction(a, b, false),
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				m[tt] = struct{}{}
			})
		}
	})

	ss := &subscription{
		pending: make(map[Step]*sync.Cond, 0),
	}
	ss.pending[a] = sync.NewCond(&sync.Mutex{}) // `a` have waiting steps
	ss.pending[b] = nil                         // `b` have finished
	// `c` is not finished

	t.Run("broadcast", func(t *testing.T) {
		ss.broadcast(a)
		ss.broadcast(b)
		ss.broadcast(c)

		expected := map[Step]*sync.Cond{a: nil, b: nil, c: nil}

		if !reflect.DeepEqual(expected, ss.pending) {
			t.Fatalf("expected %v, got %v", expected, ss.pending)
		}
	})

	t.Run("waitFor", func(t *testing.T) {
		ss.waitFor(a)
		ss.waitFor(b) // returns because step finished
		ss.waitFor(c)
	})

	t.Run("steps", func(t *testing.T) {
		a := Func(func(ctx context.Context) error {
			i := ctx.Value("i").(*int)
			*i = 10
			return nil
		})

		b := Func(func(ctx context.Context) error {
			WaitFor(a)
			i := ctx.Value("i").(*int)
			*i *= 2
			return nil
		})

		var i *int
		i = new(int)
		*i = 0
		ctx := context.WithValue(context.Background(), "i", i)

		if err := execute(nil, ctx, a); err != nil {
			t.Fatal(err)
		}
		if err := execute(nil, ctx, b); err != nil {
			t.Fatal(err)
		}

		// check i value
		if (*i) != 20 {
			t.Fatalf("expected %q, got %q", 20, (*i))
		}
	})
}
