package pipeline

import (
	"context"
	"io"

	"github.com/boomfunc/root/tools/flow"
)

type Pipeline []Layer

func New(layers ...Layer) *Pipeline {
	p := Pipeline(layers)
	return &p
}

// Run runs all layers step by step with joining inputs and outputs (by io.Pipes)
// NOTE: Run implements flow.Step interface
func (p Pipeline) Run(ctx context.Context) error {
	// Phase 1. fetch global input and output (required context information)
	// otherwise - return error orphan
	input, ok := ctx.Value("input").(io.ReadCloser)
	if !ok {
		return flow.ErrStepOrphan
	}
	output, ok := ctx.Value("output").(io.WriteCloser)
	if !ok {
		return flow.ErrStepOrphan
	}

	// Phase 2. Piping all pipeline layers
	ables := make([]Able, len(p))
	execs := make([]Exec, len(p))

	for i, layer := range p {
		newLayer := layer.(Cloneable).copy()

		ables[i] = newLayer
		execs[i] = newLayer
	}

	if err := piping(input, output, ables...); err != nil {
		return err
	}

	// Phase 3. Generate and run total `flow.Step`
	return run(ctx, execs...)
}

// TODO: why pointer? Pipeline is slice (itself pointer)
func (p *Pipeline) UnmarshalYAML(unmarshal func(interface{}) error) error {
	// inner struct for accepting strings
	var pipeline []map[string]interface{}

	if err := unmarshal(&pipeline); err != nil {
		return err
	}

	// sequece successfully translated, create layers from data
	for _, layer := range pipeline {
		// get required 'type' key
		switch t := layer["type"]; t {
		case "tcp":
			*p = append(*p, NewTCPSocket(layer["address"].(string)))

		case "process":
			*p = append(*p, NewProcess(layer["cmd"].(string)))

		default:
			return ErrUnknownLayer
		}
	}

	return nil
}
