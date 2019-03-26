package flow

import (
	"context"
	"errors"
	"testing"
)

func TestAsyncPublic(t *testing.T) {
	t.Run("New", func(t *testing.T) {
		t.Run("chan", func(t *testing.T) {
			t.Run("wait", func(t *testing.T) {
				// with wait - full object with channels
				a := newAsync(true, nil, nil)
				if a.errCh == nil {
					t.Fatal("Expected `chan error`, got <nil>")
				}
				if a.doneCh == nil {
					t.Fatal("Expected `chan struct{}`, got <nil>")
				}
			})
			t.Run("nonwait", func(t *testing.T) {
				// with nonwait - object without channels
				a := newAsync(false, nil, nil)
				if a.errCh != nil {
					t.Fatal("Expected <nil>, got `chan error`")
				}
				if a.doneCh != nil {
					t.Fatal("Expected <nil>, got `chan struct{}`")
				}
			})
		})
	})
}

func TestAsyncPrivate(t *testing.T) {
	t.Run("close", func(t *testing.T) {
		t.Run("wait", func(t *testing.T) {
			// with wait - channels onboard -> we need to close them
			a := newAsync(true, nil, nil)
			a.close(nil)
			// check that channels receive close event
			if _, ok := <-a.errCh; ok {
				t.Fatal("Expected `close` event, got real value")
			}
			if _, ok := <-a.doneCh; ok {
				t.Fatal("Expected `close` event, got real value")
			}

		})
	})

	t.Run("executeStep", func(t *testing.T) {
		var a int
		var step Step = Func(func(ctx context.Context) error {
			a++
			return nil
		})
		as := newAsync(true, nil, nil)

		t.Run("success", func(t *testing.T) {
			t.Run("normal", func(t *testing.T) {
				ctx, cancel := context.WithCancel(context.TODO())
				defer cancel() // release resources

				// otherwise panic: wg negative counter
				as.wg.Add(1)

				// run tool
				as.executeStep(ctx, cancel, step)

				// check results
				if a != 1 {
					t.Fatalf("a: expected \"%d\", got \"%d\"", 1, a)
				}

				// check for errors
				if len(as.errCh) != 0 {
					t.Fatalf("errCh: expected \"%d\", got \"%d\"", 0, len(as.errCh))
				}
			})

			t.Run("cancelled", func(t *testing.T) {
				a = 0 // reset int

				ctx, cancel := context.WithCancel(context.TODO())
				// otherwise panic: wg negative counter
				as.wg.Add(1)

				// imitate cancelling from another goroutine
				cancel()

				// run tool
				as.executeStep(ctx, cancel, step)

				// check results (cancelled - we will not run step)
				if a != 0 {
					t.Fatalf("a: expected \"%d\", got \"%d\"", 0, a)
				}

				// check for errors
				if len(as.errCh) != 0 {
					t.Fatalf("errCh: expected \"%d\", got \"%d\"", 0, len(as.errCh))
				}
			})
		})

		t.Run("error", func(t *testing.T) {
			t.Run("normal", func(t *testing.T) {
				a = 0 // reset int
				var step Step = Func(func(ctx context.Context) error {
					a++
					return errors.New("foo:bar")
				})

				ctx, cancel := context.WithCancel(context.TODO())
				defer cancel() // release resources

				// otherwise panic: wg negative counter
				as.wg.Add(1)

				// run tool
				as.executeStep(ctx, cancel, step)

				// check results
				if a != 1 {
					t.Fatalf("a: expected \"%d\", got \"%d\"", 1, a)
				}

				// check for errors
				if len(as.errCh) != 1 {
					t.Fatalf("errCh: expected \"%d\", got \"%d\"", 1, len(as.errCh))
				}
				// get error
				if err := <-as.errCh; err.Error() != "foo:bar" {
					t.Fatalf("Unexpected error, got %q", err.Error())
				}
			})
		})
	})
}

func TestErrs(t *testing.T) {
	t.Run("empty", func(t *testing.T) {
		errCh := make(chan error, 1)

		if err := errs(errCh); err != nil {
			t.Fatalf("Unexpected error, got %q", err.Error())
		}
	})

	t.Run("exist", func(t *testing.T) {
		errCh := make(chan error, 1)

		errCh <- errors.New("foo:bar")

		err := errs(errCh)
		if err == nil {
			t.Fatal("Expected error, got nil")
		}
		if err.Error() != "foo:bar" {
			t.Fatalf("Unexpected error, got %q", err.Error())
		}
	})
}

func TestAsynchronous(t *testing.T) {
	t.Run("nils", func(t *testing.T) {
		var step1, step2, step3 Step

		if err := newAsync(true, nil, step1, step2, step3).Run(context.TODO()); err != nil {
			t.Fatal(err)
		}
	})

	t.Run("success", func(t *testing.T) {
		var a, b, c int
		// define steps
		var step1 Step = Func(func(ctx context.Context) error {
			a++
			return nil
		})
		var step2 Step = Func(func(ctx context.Context) error {
			b++
			return nil
		})
		var step3 Step = Func(func(ctx context.Context) error {
			c++
			return nil
		})

		// run tool
		if err := newAsync(true, nil, step1, step2, step3).Run(context.TODO()); err != nil {
			t.Fatal(err)
		}

		// check results
		if a != 1 {
			t.Fatalf("a: expected \"%d\", got \"%d\"", 1, a)
		}
		if b != 1 {
			t.Fatalf("b: expected \"%d\", got \"%d\"", 1, b)
		}
		if c != 1 {
			t.Fatalf("c: expected \"%d\", got \"%d\"", 1, c)
		}
	})

	t.Run("error", func(t *testing.T) {
		var a, b, c int
		// define steps
		var step1 Step = Func(func(ctx context.Context) error {
			a++
			return nil
		})
		var step2 Step = Func(func(ctx context.Context) error {
			b++
			return errors.New("Error from step2")
		})
		var step3 Step = Func(func(ctx context.Context) error {
			c++
			return nil
		})

		// run tool
		err := newAsync(true, nil, step1, step2, step3).Run(context.TODO())
		if err == nil {
			t.Fatal("Expected error, got nil")
		}
		if err.Error() != "Error from step2" {
			t.Fatalf("Unexpected error, got %q", err.Error())
		}

		// check results
		// time to time different because concurrent
		// checkMatrix(t, objs, matrix)
	})
}
