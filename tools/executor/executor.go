package executor

import (
	"context"
)

type executor struct {
	operations []*operation
}

func New(operations ...*operation) *executor {
	return &executor{
		operations: operations,
	}
}

func (ex *executor) AddOperations(ops ...*operation) {
	for _, op := range ops {
		ex.operations = append(ex.operations, op)
	}
}

func (ex *executor) Run(ctx context.Context) error {
	for _, op := range ex.operations {
		if err := op.Run(ctx); err != nil {
			return err
		}
	}

	return nil
}
