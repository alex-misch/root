package kvs

import (
	"context"
	"fmt"
	"testing"
)

func TestNewWithContext(t *testing.T) {
	tableTests := []context.Context{
		context.Background(),
		context.WithValue(context.Background(), ContextKey, "foobar"),
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			ctx := NewWithContext(tt)
			storage, ok := ctx.Value(ContextKey).(Storage)
			if !ok {
				t.Fatalf("type: expected %q, got \"%v\"", "Storage", storage)
			}
		})
	}
}

func TestGetStrictWithContext(t *testing.T) {
	tableTests := []struct {
		ctx context.Context
		err error // output error
	}{
		{context.Background(), ErrContextNoStorage},
		{NewWithContext(context.Background()), nil},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if _, err := GetStrictWithContext(tt.ctx, "default", "foo"); err != tt.err {
				t.Fatalf("error: expected %q, got %q", tt.err, err)
			}
		})
	}
}

func TestSetStrictWithContext(t *testing.T) {
	tableTests := []struct {
		ctx context.Context
		err error // output error
	}{
		{context.Background(), ErrContextNoStorage},
		{NewWithContext(context.Background()), nil},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if err := SetStrictWithContext(tt.ctx, "default", "foo", "bar"); err != tt.err {
				t.Fatalf("error: expected %q, got %q", tt.err, err)
			}
		})
	}
}
