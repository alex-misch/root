package flow

import (
	"context"
	"fmt"
	"reflect"
	"runtime"
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
