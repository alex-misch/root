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
	// check context with storage
	storage, ok := ctx.Value(ContextKey).(Storage)
	if !ok {
		return nil, ErrContextNoStorage
	}
	// storage onboard, get value
	return storage.Get(namespace, key), nil
}

// SetStrictWithContext is a shortcut for setting value to storage, stored in context
// returns error additional (if not contextKey)
func SetStrictWithContext(ctx context.Context, namespace, key string, value interface{}) error {
	// check context with storage
	storage, ok := ctx.Value(ContextKey).(Storage)
	if !ok {
		return ErrContextNoStorage
	}
	// storage onboard, set value
	storage.Set(namespace, key, value)
	return nil
}

// WaitStrictWithContext is a shortcut for waiting value from storage, stored in context
// returns error additional (if not contextKey)
func WaitStrictWithContext(ctx context.Context, namespace, key string) error {
	// check context with storage
	storage, ok := ctx.Value(ContextKey).(Storage)
	if !ok {
		return ErrContextNoStorage
	}
	// storage onboard, wait value
	storage.Wait(namespace, key)
	return nil
}

// GetWithContext is a shortcut for getting value from storage, stored in context
func GetWithContext(ctx context.Context, namespace, key string) interface{} {
	// check context with storage
	storage, ok := ctx.Value(ContextKey).(Storage)
	if !ok {
		return nil
	}
	// storage onboard, get value
	return storage.Get(namespace, key)
}

// SetWithContext is a shortcut for setting value to storage, stored in context
func SetWithContext(ctx context.Context, namespace, key string, value interface{}) {
	// check context with storage
	storage, ok := ctx.Value(ContextKey).(Storage)
	if !ok {
		return
	}
	// storage onboard, set value
	storage.Set(namespace, key, value)
}

// WaitWithContext is a shortcut for waiting value from storage, stored in context
func WaitWithContext(ctx context.Context, namespace, key string) {
	// check context with storage
	storage, ok := ctx.Value(ContextKey).(Storage)
	if !ok {
		return
	}
	// storage onboard, wait value
	storage.Wait(namespace, key)
}
