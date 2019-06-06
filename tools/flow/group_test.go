package flow

import (
	"container/heap"
	"context"
	"errors"
	"fmt"
	"math"
	"reflect"
	"testing"
)

func TestGroupPrivate(t *testing.T) {
	t.Run("has", func(t *testing.T) {
		tableTests := []struct {
			flags  uint8
			bit    uint8
			having bool
		}{
			{0, R_CONCURRENT, false},
			{0, W_BACKGROUND, false},

			{W_BACKGROUND, R_CONCURRENT, false},
			{W_BACKGROUND, W_BACKGROUND, true},

			{R_CONCURRENT, R_CONCURRENT, true},
			{R_CONCURRENT, W_BACKGROUND, false},

			{R_CONCURRENT | W_BACKGROUND, R_CONCURRENT, true},
			{R_CONCURRENT | W_BACKGROUND, W_BACKGROUND, true},
		}

		// main goal - no panics
		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				g := &group{flags: tt.flags}
				if having := g.has(tt.bit); having != tt.having {
					t.Fatalf("Expected \"%t\", got \"%t\"", tt.having, having)
				}
			})
		}
	})

	t.Run("prepare", func(t *testing.T) {
		// some shortcuts
		c1 := context.Background()
		c1c, cancel1 := context.WithCancel(c1) // cancelled background
		c2 := context.WithValue(context.Background(), "foo", "bar")
		c2c, cancel2 := context.WithCancel(c2) // cancelled with value
		c3 := context.WithValue(c2, "bar", "baz")
		c3c, cancel3 := context.WithCancel(c3) // cancelled with value from with value

		defer func() {
			cancel1()
			cancel2()
			cancel3()
		}()

		tableTests := []struct {
			// input
			g   *group
			ctx context.Context
			// output
			octx context.Context
		}{
			// Orphan context mode set - always new context.
			{&group{flags: CTX_GROUP_ORPHAN}, c2, c1c},
			{&group{flags: CTX_GROUP_ORPHAN}, nil, c1c},
			{&group{ctx: c3, flags: CTX_GROUP_ORPHAN}, c2, c1c},
			{&group{ctx: c3, flags: CTX_GROUP_ORPHAN}, nil, c1c},
			// If already set - ignore.
			{&group{ctx: c3}, nil, c3c},
			{&group{ctx: c1}, c2, c1c},
			{&group{ctx: c2}, c3, c2c},
			// If new ctx is nil - create new one.
			{&group{}, nil, c1c},
			{&group{}, c1, c1c},
			{&group{}, c2, c2c},
			{&group{}, c3, c3c},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				tt.g.prepare(tt.ctx)
				if !reflect.DeepEqual(tt.g.ctx, tt.octx) {
					t.Fatalf("Expected %q, got %q", tt.octx, tt.g.ctx)
				}
				// cancel function always non nil
				if tt.g.cancel == nil {
					t.Fatalf("Expected %q, got \"%v\"", "<non-nil>", nil)
				}
			})
		}
	})

	t.Run("getContext", func(t *testing.T) {
		tableTests := []struct {
			g   *group
			ctx context.Context
		}{
			{&group{}, context.Background()},
			{&group{ctx: context.TODO()}, context.TODO()},
			{&group{flags: CTX_STEP_NEW}, context.Background()},
			{&group{ctx: context.TODO(), flags: CTX_STEP_NEW}, context.Background()},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if ctx := tt.g.getContext(); ctx != tt.ctx {
					t.Fatalf("Expected %q, got %q", tt.ctx, ctx)
				}
			})
		}
	})

	t.Run("runner", func(t *testing.T) {
		// prepare data
		var total uint8
		steps := make([]Step, 4)
		workers := WorkersHeap(1)

		// generate steps
		for i := 0; i < len(steps); i++ {
			j := i
			steps[i] = Func(func(ctx context.Context) error {
				fl := uint8(math.Pow(2, float64(j)))
				total |= fl
				// third step (index == 2) will fail, sequence must break
				if j == 2 {
					return errors.New("OOPS")
				}

				return nil
			})
		}

		t.Run("sequence", func(t *testing.T) {
			// reset total bytes
			total = 0

			g := &group{
				workers: workers,
				steps:   StepsHeap(steps...),
			}
			// NOTE: no matter about error channel hunging because there is no channel defined
			g.runner()
			// after `runner` all workers must be attached back to heap
			if l := workers.Len(); l != 1 {
				t.Fatalf("Expected %q, got %q", 1, l)
			}
			// check total bit mask
			for i := 0; i < len(steps); i++ {
				// last step was not running, because with i == 2 fails
				if i == len(steps)-1 {
					continue
				}

				// All other steps - must be invoked.
				fl := uint8(math.Pow(2, float64(i)))
				if total&fl == 0 {
					t.Fatalf("`step%d` not runned", i+1)
				}
			}
		})

		t.Run("concurrent", func(t *testing.T) {
			// reset total bytes
			total = 0

			g := &group{
				flags:   R_CONCURRENT,
				workers: workers,
				steps:   StepsHeap(steps...),
			}
			// NOTE: no matter about error channel hunging because there is no channel defined
			g.runner()
			// after `runner` all workers must be attached back to heap
			if l := workers.Len(); l != 1 {
				t.Fatalf("Expected %q, got %q", 1, l)
			}
			// check total bit mask
			for i := 0; i < len(steps); i++ {
				fl := uint8(math.Pow(2, float64(i)))
				if total&fl == 0 {
					t.Fatalf("`step%d` not runned", i+1)
				}
			}
		})
	})

	t.Run("waiter", func(t *testing.T) {
		t.Run("error", func(t *testing.T) {
			stepErr := errors.New("OOOPS")

			// error means some step failed and .fail(err) was invoked.
			g := &group{errCh: make(chan error)}
			go func() {
				g.fail(stepErr)
				g.Close()
			}()

			if err := g.waiter(); !reflect.DeepEqual(err, stepErr) {
				t.Fatalf("Expected %v, got %v", stepErr, err)
			}
		})

		t.Run("close", func(t *testing.T) {
			// Close means all steps were successful.
			g := &group{errCh: make(chan error)}
			go g.Close()

			if err := g.waiter(); err != nil {
				t.Fatal(err)
			}
		})
	})

	t.Run("run", func(t *testing.T) {
		// preparing data
		var total uint8

		var ran uint8 = 1      // step was run
		var failed uint8 = 2   // step returned error itself
		var canceled uint8 = 4 // step failed and context was closed

		// tool for generating step
		stepper := func(err error) Step {
			return Func(func(ctx context.Context) error {
				// fill bits
				total |= ran
				if err != nil {
					total |= failed
				}
				// return
				return err
			})
		}

		// mark total bitmask as canceled
		cancel := func() { total |= canceled }
		err := errors.New("OOOPS")   // error that can be returned from step
		errCh := make(chan error, 1) // buffered for nonblock i/o

		// create canceled context for one case
		cctx, c := context.WithCancel(context.Background())
		c()

		tableTests := []struct {
			step   Step               // input step
			ctx    context.Context    // input context
			err    error              // output error
			total  uint8              // bitmask of total final execution flow
			errCh  chan error         // group `agent` linked
			cancel context.CancelFunc // cancel group context
		}{
			{stepper(nil), cctx, context.Canceled, 0, nil, nil},                               // canceled context
			{stepper(err), cctx, context.Canceled, 0, nil, nil},                               // canceled context
			{stepper(nil), context.Background(), nil, ran, nil, nil},                          // regular no error case
			{stepper(err), context.Background(), err, ran | failed, nil, nil},                 // error case, no channel in group, no cancel func (main check - no errors and panics)
			{stepper(err), context.Background(), err, ran | failed | canceled, errCh, cancel}, // error case, channel and cancel onboard
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				// reset flow
				total = 0

				// create group for this test case
				g := &group{
					errCh:  tt.errCh,
					ctx:    tt.ctx,
					cancel: tt.cancel,
				}
				g.wg.Add(1) // run calls defer which decreases waiting counter (otherwise panic about negative counter)

				// check direct returned value
				if err := g.run(tt.step); err != tt.err {
					t.Fatalf("Expected %q, got %q", tt.err, err)
				}

				// Defer wg.Done check (main goal - no hung).
				g.wg.Wait()

				// Check errors from step.
				if tt.errCh != nil && tt.err != nil {
					// check error was sended
					if err := <-g.errCh; !reflect.DeepEqual(err, tt.err) {
						t.Fatalf("Expected %q, got %q", tt.err, err)
					}
				}

				// check bitmask
				if total != tt.total {
					t.Fatalf("Expected %q, got %v", tt.total, total)
				}
			})
		}
	})

	t.Run("fail", func(t *testing.T) {
		// fail cancels ctx and send error to channel
		cancelled := false
		cancel := func() { cancelled = true }
		err := errors.New("OOOPS")   // error that can be returned from step
		errCh := make(chan error, 1) // buffered for nonblock i/o

		tableTests := []struct {
			err    error              // output error
			errCh  chan error         // group `agent` linked
			cancel context.CancelFunc // cancel group context
		}{
			{nil, nil, nil},
			{err, nil, nil},
			{err, errCh, nil},
			{err, nil, cancel},
			{err, errCh, cancel},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				// reset flags
				cancelled = false

				g := &group{
					errCh:  tt.errCh,
					cancel: tt.cancel,
				}
				g.fail(tt.err)

				// check results
				if tt.cancel != nil {
					// must be cancelled
					if cancelled != true {
						t.Fatalf("Expected %t, got %t", true, cancelled)
					}
				}

				// Check errors from step.
				if tt.errCh != nil && tt.err != nil {
					// check error was sended
					if err := <-g.errCh; !reflect.DeepEqual(err, tt.err) {
						t.Fatalf("Expected %q, got %q", tt.err, err)
					}
				}
			})
		}
	})
}

func TestGroupPublic(t *testing.T) {
	t.Run("Close", func(t *testing.T) {
		cancelled := false
		cancel := func() { cancelled = true }

		tableTests := []struct {
			errCh  chan error
			cancel context.CancelFunc
		}{
			{nil, nil},
			{make(chan error), cancel},
			{nil, cancel},
			// TODO: also, channel might be already closed
		}

		// main goal - no panics
		g := &group{}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				// reset flags
				cancelled = false
				g.errCh = tt.errCh
				g.cancel = tt.cancel
				if err := g.Close(); err != nil {
					t.Fatal(err)
				}
				// Check context closing.
				if tt.cancel != nil {
					// must be cancelled
					if cancelled != true {
						t.Fatalf("Expected %t, got %t", true, cancelled)
					}
				}

				// Channel must be both closed and unlinked.
				if tt.errCh != nil {
					// Check closed
					err, ok := <-tt.errCh // must not hung
					if ok {
						t.Fatalf("errCh closing: Expected %t, got %t", false, ok)
					}
					if !reflect.DeepEqual(err, nil) {
						t.Fatalf("err: Expected %v, got %v", nil, err)
					}
					// Check unlinked
					if g.errCh != nil {
						t.Fatalf("errCh: Expected %v, got %v", nil, g.errCh)
					}
				}
			})
		}
	})

	t.Run("String", func(t *testing.T) {
		tableTests := []struct {
			// input
			g *group
			s string
		}{
			{&group{}, "Group(background=false)"},
			{&group{flags: W_BACKGROUND}, "Group(background=true)"},
			{&group{flags: R_CONCURRENT}, "Concurrent(background=false)"},
			{&group{flags: R_CONCURRENT | W_BACKGROUND}, "Concurrent(background=true)"},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if s := tt.g.String(); s != tt.s {
					t.Fatalf("Expected %q, got %q", tt.s, s)
				}
			})
		}
	})

	t.Run("NewGroup", func(t *testing.T) {
		sucStep := Func(func(ctx context.Context) error { return nil })
		errStep := Func(func(ctx context.Context) error { return errors.New("OOOPS") })

		tableTests := []struct {
			workers heap.Interface
			steps   heap.Interface
			flags   uint8
			isNil   bool // check fo non-nil step
		}{
			{nil, nil, 0, true},                       // no steps - no group
			{WorkersHeap(5), nil, R_CONCURRENT, true}, // no steps - no group
			{WorkersHeap(5), StepsHeap(nil, nil), CTX_STEP_NEW | CTX_GROUP_ORPHAN, true}, // no steps - no group

			{nil, StepsHeap(sucStep, errStep), 0, false},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				step := NewGroup(tt.workers, tt.steps, tt.flags)
				// Check group as Step
				if tt.isNil {
					if step != nil {
						t.Fatalf("Expected %v, got %v", nil, step)
					}
					return // nothing to check more - step is nil
				}

				if step == nil {
					t.Fatalf("Expected %v, got %v", "<non-nil>", nil)
				}

				// Check as group struct
				g := step.(*group)
				// Flags and workers passes without any modifications.
				if g.workers != tt.workers {
					t.Fatalf("Expected %v, got %v", tt.workers, g.workers)
				}
				if g.flags != tt.flags {
					t.Fatalf("Expected %v, got %v", tt.flags, g.flags)
				}
				// Error channel creates automatically.
				if g.errCh == nil {
					t.Fatalf("Expected %v, got %v", "<non-nil>", nil)
				}
			})
		}
	})
}
