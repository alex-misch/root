package flow

import (
	"container/heap"
	"context"
	"errors"
	"fmt"
	"math"
	"testing"
)

func TestGroupPrivate(t *testing.T) {
	t.Run("runStep", func(t *testing.T) {
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
		errCh := make(chan error, 1) // byffered for nonblock i/o

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
			{stepper(err), context.Background(), err, ran | failed, nil, nil},                 // error case, no channel in group, no cencel func (main check - no errors and panics)
			{stepper(err), context.Background(), err, ran | failed | canceled, errCh, cancel}, // error case, channel and cancel onboard
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				// reset flow
				total = 0

				// create group for this test case
				g := &group{
					errCh:  tt.errCh,
					cancel: tt.cancel,
				}
				g.wg.Add(1) // runStep calls defer closeStep which decreases waiting counter (otherwise panic about negative counter)

				// check direct returned value
				if err := g.runStep(tt.ctx, tt.step); err != tt.err {
					t.Fatalf("Expected %q, got %q", tt.err, err)
				}
				if tt.errCh != nil && tt.err != nil {
					// check error was sended
					select {
					case err := <-g.errCh:
						// error arrived from channel
						if err != tt.err {
							t.Fatalf("Expected %q, got %q", tt.err, err)
						}
					default:
						// Default is must be to avoid blocking
						t.Fatalf("Expected %q, got %v", tt.err, nil)
					}
				}

				// check bitmask
				if total != tt.total {
					t.Fatalf("Expected %q, got %v", tt.total, total)
				}
			})
		}
	})

	t.Run("closeStep", func(t *testing.T) {
		// preparing
		workers := WorkersHeap(2)
		heap.Pop(workers)
		g := &group{workers: workers}
		g.wg.Add(1)

		// check worker returned and waiting count decreased
		g.closeStep(Func(nil))
		if l := workers.Len(); l != 2 {
			t.Fatalf("Expected %q, got %q", 2, l)
		}

		// WaitGroup must not hung
		g.wg.Wait()
	})

	t.Run("wait", func(t *testing.T) {
		t.Run("no", func(t *testing.T) {
			// no error
			errCh := make(chan error, 1)
			doneCh := make(chan struct{}, 1)
			g := &group{errCh: errCh, doneCh: doneCh}
			if err := g.wait(); err != nil {
				t.Fatal(err)
			}
		})

		t.Run("yes", func(t *testing.T) {
			// with error
			errCh := make(chan error, 1)
			doneCh := make(chan struct{}, 1)
			g := &group{errCh: errCh, doneCh: doneCh}
			errCh <- errors.New("FOOBAR")
			if err := g.wait(); err.Error() != "FOOBAR" {
				t.Fatalf("Expected %q, got %q", "FOOBAR", err.Error())
			}
		})
	})

	t.Run("has", func(t *testing.T) {
		tableTests := []struct {
			flags  uint8
			bit    uint8
			having bool
		}{
			{0, R_CONCURRENT, false},
			{0, W_DELAY, false},

			{W_DELAY, R_CONCURRENT, false},
			{W_DELAY, W_DELAY, true},

			{R_CONCURRENT, R_CONCURRENT, true},
			{R_CONCURRENT, W_DELAY, false},

			{R_CONCURRENT | W_DELAY, R_CONCURRENT, true},
			{R_CONCURRENT | W_DELAY, W_DELAY, true},
		}

		// main goal - no panics
		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if having := newGroup(nil, nil, tt.flags).has(tt.bit); having != tt.having {
					t.Fatalf("Expected \"%t\", got \"%t\"", tt.having, having)
				}
			})
		}
	})

	t.Run("sequence", func(t *testing.T) {
		// prepare data
		var total uint8
		steps := make([]Step, 4)
		workers := WorkersHeap(1)

		// generate steps
		for i := 0; i < len(steps); i++ {
			j := i
			steps[i] = Func(func(ctx context.Context) error {
				total |= uint8(math.Pow(2, float64(j)))
				// third step (index == 2) will fail, sequence must break
				if j == 2 {
					return errors.New("OOPS")
				}
				return nil
			})
		}

		// run group
		g := &group{
			steps:   StepsHeap(steps...),
			workers: workers,
			doneCh:  make(chan struct{}, 1),
		}
		g.sequence(context.Background())

		// after `runner` agent must not hung
		// NOTE: no matter about error channel because there is no channel defined
		g.wait()
		// after `runner` all workers must be attached back to heap
		if l := workers.Len(); l != 1 {
			t.Fatalf("Expected %q, got %q", 1, l)
		}

		// check total bit mask
		for i := 0; i < len(steps); i++ {
			if total&uint8(i+1) == 0 {
				t.Fatalf("`step%d` not runned", i+1)
			}
		}
	})
}

func TestGroupPublic(t *testing.T) {
	t.Run("Close", func(t *testing.T) {
		tableTests := []struct {
			errCh  chan error
			doneCh chan struct{}
			cancel context.CancelFunc
		}{
			{nil, nil, nil},
			{make(chan error), make(chan struct{}), func() {}},
			// TODO: also, channel might be already closed
		}

		// main goal - no panics
		g := &group{}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				g.errCh = tt.errCh
				g.doneCh = tt.doneCh
				g.cancel = tt.cancel
				if err := g.Close(); err != nil {
					t.Fatal(err)
				}
				// channel must be both closed and unlinked
				if g.errCh != nil {
					t.Fatalf("errCh: Expected %v, got %v", nil, g.errCh)
				}
				if g.doneCh != nil {
					t.Fatalf("doneCh: Expected %v, got %v", nil, g.doneCh)
				}
			})
		}
	})
}
