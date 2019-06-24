package kvs

// set of tools for integrating with context

import (
	"context"
	"errors"
)

var (
	ContextKey          = "storage"
	ErrContextNoStorage = errors.New("tools/kvs: No Storage in provided context")
)

// NewWithContext returns context with buil-in storage
func NewWithContext(ctx context.Context, namespaces ...string) context.Context {
	return context.WithValue(ctx, ContextKey, New(namespaces...))
}

// GetStrictWithContext is a shortcut for getting value from storage, stored in context
// returns error additional (if not contextKey)
func GetStrictWithContext(ctx context.Context, namespace, key string) (interface{}, error) {
	if storage, ok := ctx.Value(ContextKey).(Storage); ok {
		// Storage onboard, get and return value.
		return storage.Get(namespace, key), nil
	}

	return nil, ErrContextNoStorage
}

// SetStrictWithContext is a shortcut for setting value to storage, stored in context
// returns error additional (if not contextKey)
func SetStrictWithContext(ctx context.Context, namespace, key string, value interface{}) error {
	if storage, ok := ctx.Value(ContextKey).(Storage); ok {
		// Storage onboard, set value.
		storage.Set(namespace, key, value)
		return nil
	}

	return ErrContextNoStorage
}

// WaitStrictWithContext is a shortcut for waiting value from storage, stored in context
// returns error additional (if not contextKey)
func WaitStrictWithContext(ctx context.Context, namespace, key string) error {
	if storage, ok := ctx.Value(ContextKey).(Storage); ok {
		// Storage onboard, wait value.
		storage.Wait(namespace, key)
		return nil
	}

	return ErrContextNoStorage
}

// GetWithContext is a shortcut for getting value from storage, stored in context
func GetWithContext(ctx context.Context, namespace, key string) interface{} {
	if storage, ok := ctx.Value(ContextKey).(Storage); ok {
		// Storage onboard, get and return value.
		return storage.Get(namespace, key)
	}

	return nil
}

// SetWithContext is a shortcut for setting value to storage, stored in context
func SetWithContext(ctx context.Context, namespace, key string, value interface{}) {
	if storage, ok := ctx.Value(ContextKey).(Storage); ok {
		// Storage onboard, set value.
		storage.Set(namespace, key, value)
	}
}

// WaitWithContext is a shortcut for waiting value from storage, stored in context
func WaitWithContext(ctx context.Context, namespace, key string) {
	if storage, ok := ctx.Value(ContextKey).(Storage); ok {
		// Storage onboard, wait value.
		storage.Wait(namespace, key)
	}
}
