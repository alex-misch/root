package flow

import (
	"context"
	"testing"
)

func TestFunc(t *testing.T) {
	var i int

	f := func(ctx context.Context) error {
		i++
		return nil
	}

	if err := Execute(Func(f)); err != nil {
		t.Fatalf("Unexpected error, got %q", err.Error())
	}

	if i != 1 {
		t.Fatalf("i: expected %q, got %q", 1, i)
	}
}
