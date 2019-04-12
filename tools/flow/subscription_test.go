package flow

// TODO: check for hasheable all builtin Step types

// import (
// 	"context"
// 	"testing"
// )
//
// func TestSubscription(t *testing.T) {
//
// 	var i int
// 	t.Log(i)
//
// 	a := Func(func(ctx context.Context) error {
// 		i = 10
// 		return nil
// 	})
//
// 	b := Func(func(ctx context.Context) error {
// 		WaitFor(a)
//
// 		return nil
// 	})
//
// 	t.Error("OOPS")
//
// 	Concurrent(nil, a, b).Run(context.Background())
//
// 	// t.Run("New", func(t *testing.T) {
// 	//
// 	// })
// }
