package flow

import (
	"context"
	"fmt"
	"reflect"
	"runtime"
	"io"
)

// function is basic type of step (executable)
// just wrapper for function that implements Step interface
type function struct {
	inner func(context.Context) error
}

// Func returns wrapper that implements `Step` interface
func Func(inner func(context.Context) error) Step {
	if inner == nil {
		return nil
	}

	return &function{
		inner: inner,
	}
}

// Run implements Step interface
func (f *function) Run(ctx context.Context) error {
	return f.inner(ctx)
}

// String implements fmt.Stringer interface
func (f function) String() string {
	return fmt.Sprintf("FUNC(%s)", runtime.FuncForPC(reflect.ValueOf(f.inner).Pointer()).Name())
}

////////

// function is basic type of step (executable)
// just wrapper for function that implements Step interface
type function2 struct {
	inner func(context.Context, io.Reader, io.Writer, io.Writer) error
}

// Func returns wrapper that implements `Step` interface
func Func2(inner func(context.Context, io.Reader, io.Writer, io.Writer) error) SStep {
	if inner == nil {
		return nil
	}

	return &function2{
		inner: inner,
	}
}

// Run implements Step interface
func (f *function2) Run(ctx context.Context, stdin io.Reader, stdout, stderr io.Writer) error {
	return f.inner(ctx, stdin, stdout, stderr)
}

// String implements fmt.Stringer interface
func (f function2) String() string {
	return fmt.Sprintf("FUNC(%s)", runtime.FuncForPC(reflect.ValueOf(f.inner).Pointer()).Name())
}
