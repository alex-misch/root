package flow2

import (
	"context"
	"fmt"
	"reflect"
	"runtime"
)

// Func is basic type of step (executable)
// just wrapper for function that implements Step interface
type Func func(context.Context, Filer, Filer) error

// Run implements Step interface
func (f Func) Run(ctx context.Context, input Filer, output Filer) error {
	return f(ctx, input, output)
}

// String implements fmt.Stringer interface
func (f Func) String() string {
	return fmt.Sprintf("FUNC(%s)", runtime.FuncForPC(reflect.ValueOf(f).Pointer()).Name())
}
