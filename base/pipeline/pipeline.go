package pipeline

import (
	"context"
	"errors"
	"fmt"
	"io"

	"github.com/boomfunc/root/base/tools"
	"github.com/boomfunc/root/tools/flow"
)

var (
	ErrUnknownLayer = errors.New("base/pipeline: Unknown layer type")
)

type Pipeline []Layer

// New creates new pipelines from layers
// NOTE: implements flow.Step interface
func New(layers ...Layer) Pipeline {
	if len(layers) == 0 {
		return nil
	}

	return Pipeline(layers)
}

// Run runs all layers step by step with joining inputs and outputs (by io.Pipes)
// NOTE: Run implements flow.Step interface
func (p Pipeline) Run(ctx context.Context) error {
	// Phase 1. fetch global input and output (required context information)
	// otherwise - return error orphan
	input, ok := ctx.Value("input").(io.Reader)
	if !ok {
		return flow.ErrStepOrphan
	}
	output, ok := ctx.Value("output").(io.Writer)
	if !ok {
		return flow.ErrStepOrphan
	}

	// MiddlePhase. Convert to Closer interface
	inputCloser := tools.ReadCloser(input)
	outputCloser := tools.WriteCloser(output)

	// Phase 2. Piping all pipeline layers
	ables := make([]Able, len(p))
	execs := make([]Exec, len(p))

	for i, layer := range p {
		newLayer := layer.(Cloneable).copy()

		ables[i] = newLayer
		execs[i] = newLayer
	}

	if err := piping(inputCloser, outputCloser, ables...); err != nil {
		return fmt.Errorf("base/pipeline: %s", err)
	}

	// Phase 3. Generate and run total `flow.Step`
	return run(ctx, execs...)
}

// UnmarshalYAML implements yaml Unmarshaller interface
func (p *Pipeline) UnmarshalYAML(unmarshal func(interface{}) error) error {
	// inner struct for accepting map of strings
	var pipeline []map[string]interface{}

	if err := unmarshal(&pipeline); err != nil {
		return fmt.Errorf("base/pipeline: %s", err)
	}

	// sequece successfully translated, create layers from data
	for _, layer := range pipeline {
		// get required 'type' key
		switch t := layer["type"]; t {
		case "tcp":
			*p = append(*p, NewTCPSocket(layer["address"].(string)))

		case "process":
			*p = append(*p, NewProcess(layer["cmd"].(string)))

		case "plugin":
			*p = append(*p, NewPlugin(layer["path"].(string), layer["name"].(string)))

		default:
			return ErrUnknownLayer
		}
	}

	return nil
}
