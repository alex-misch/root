package flow

import (
	"context"
	"errors"
	"testing"
)

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

func TestExecute(t *testing.T) {
	var a int
	var step Step = Func(func(ctx context.Context) error {
		a++
		return nil
	})

	t.Run("success", func(t *testing.T) {
		t.Run("normal", func(t *testing.T) {
			errCh := make(chan error, 1)
			ctx, cancel := context.WithCancel(context.TODO())
			defer cancel() // release resources

			// run tool
			execute(step, errCh, ctx, cancel)

			// check results
			if a != 1 {
				t.Fatalf("a: expected \"%d\", got \"%d\"", 1, a)
			}

			// check for errors
			if len(errCh) != 0 {
				t.Fatalf("errCh: expected \"%d\", got \"%d\"", 0, len(errCh))
			}
		})

		t.Run("cancelled", func(t *testing.T) {
			a = 0 // reset int

			errCh := make(chan error, 1)
			ctx, cancel := context.WithCancel(context.TODO())

			// imitate cancelling from another goroutine
			cancel()

			// run tool
			execute(step, errCh, ctx, cancel)

			// check results (cancelled - we will not run step)
			if a != 0 {
				t.Fatalf("a: expected \"%d\", got \"%d\"", 0, a)
			}

			// check for errors
			if len(errCh) != 0 {
				t.Fatalf("errCh: expected \"%d\", got \"%d\"", 0, len(errCh))
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

			errCh := make(chan error, 1)
			ctx, cancel := context.WithCancel(context.TODO())
			defer cancel() // release resources

			// run tool
			execute(step, errCh, ctx, cancel)

			// check results
			if a != 1 {
				t.Fatalf("a: expected \"%d\", got \"%d\"", 1, a)
			}

			// check for errors
			if len(errCh) != 1 {
				t.Fatalf("errCh: expected \"%d\", got \"%d\"", 1, len(errCh))
			}
			// get error
			if err := <-errCh; err.Error() != "foo:bar" {
				t.Fatalf("Unexpected error, got %q", err.Error())
			}
		})
	})
}

func TestAsynchronous(t *testing.T) {
	t.Run("nils", func(t *testing.T) {
		var step1, step2, step3 Step

		if err := asynchronous(context.TODO(), true, nil, step1, step2, step3); err != nil {
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
		if err := asynchronous(context.TODO(), true, nil, step1, step2, step3); err != nil {
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
		err := asynchronous(context.TODO(), true, nil, step1, step2, step3)
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
