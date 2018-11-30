package executor

import (
	"context"
)

// executor is main entrypoint with two kinds of run:
// - concurrent
// - synchronous
type executor []Step

func New(steps ...Step) executor {
	return executor(steps)
}

func (group executor) Concurrent(ctx context.Context) error {
	return concurrent(ctx, group...)
}

func (group executor) Synchronous(ctx context.Context) error {
	return synchronous(ctx, group...)
}
