package executor

import (
	"context"
)

type executor struct {
	operations []*operation
	ctx        context.Context
}

func New(ctx context.Context, operations ...*operation) *executor {
	return &executor{
		operations: operations,
		ctx:        ctx,
	}
}

func (ex *executor) AddOperations(ops ...*operation) {
	for _, op := range ops {
		ex.operations = append(ex.operations, op)
	}
}

func (ex *executor) Run() error {
	for _, op := range ex.operations {
		if err := op.Run(ex.ctx); err != nil {
			return err
		}
	}

	return nil
}
