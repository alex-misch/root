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

// func TestConcurrent(t *testing.T) {
// 	t.Run("initial", func(t *testing.T) {
// 		objs := []*fake{
// 			&fake{aa: 0, bb: 0, cc: 0},
// 			&fake{aa: 0, bb: 1, cc: 0},
// 		}
// 		matrix := [][]int{
// 			[]int{0, 0, 0},
// 			[]int{0, 1, 0},
// 		}
// 		checkMatrix(t, objs, matrix)
// 	})
//
// 	t.Run("success", func(t *testing.T) {
// 		objs := []*fake{
// 			&fake{},
// 		}
// 		matrix := [][]int{
// 			[]int{1, 1, 1},
// 		}
//
// 		if err := concurrent(context.TODO(), objs[0].a, objs[0].b, objs[0].c); err != nil {
// 			t.Fatal(err)
// 		}
//
// 		checkMatrix(t, objs, matrix)
// 	})
//
// 	t.Run("error", func(t *testing.T) {
// 		// b method will return error
// 		objs := []*fake{
// 			&fake{mockBB: true},
// 		}
// 		// matrix := [][]int{
// 		// 	[]int{1, 1, 0},
// 		// }
//
// 		err := concurrent(context.TODO(), objs[0].a, objs[0].b, objs[0].c)
// 		if err == nil {
// 			t.Fatal("Expected error, got nil")
// 		}
// 		if err.Error() != "b failed" {
// 			t.Fatalf("Unexpected error, got %q", err.Error())
// 		}
//
// 		// time to time different because concurrent
// 		// checkMatrix(t, objs, matrix)
// 	})
// }
