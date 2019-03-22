package pipeline

import (
	"context"
	"errors"
	"fmt"
	"plugin"

	"github.com/boomfunc/root/tools/flow"
)

var (
	ErrPluginNoStep = errors.New("base/pipeline/plugin: no step loaded")
)

// plug is underlying struct describes raw data for loading go plugin as a `step`
type plug struct {
	path string
	name string
	step flow.Step
	stdio
}

// NewPlugin returns pipeline.Layer of plugin type
func NewPlugin(path, name string) Layer {
	return &plug{
		path: path,
		name: name,
	}
}

func (p *plug) copy() Layer {
	clone := *p
	return &clone
}

func (p *plug) prepare(ctx context.Context) error {
	// step already loaded
	if p.step != nil {
		return nil
	}

	// 1. open the so file to load the symbols
	pl, err := plugin.Open(p.path)
	if err != nil {
		return fmt.Errorf("base/pipeline/plugin: %s", err)
	}

	// 2. look up a symbol (an exported function or variable)
	sym, err := pl.Lookup(p.name)
	if err != nil {
		return fmt.Errorf("base/pipeline/plugin: %s", err)
	}

	// 3. Assert that loaded symbol is of a desired type (flow.Step interface)
	step, err := flow.ToStep(sym)
	if err != nil {
		return fmt.Errorf("base/pipeline/plugin: %s", err)
	}

	// 4. save step for future invoking
	p.step = step

	return nil
}

func (p *plug) check(ctx context.Context) error {
	// check layer piped
	if err := p.checkStdio(); err != nil {
		return err
	}

	// check step already loaded
	if p.step == nil {
		return ErrPluginNoStep
	}

	return nil
}

func (p *plug) run(ctx context.Context) error {
	// TODO: look not elegnt, i want `fake` plugin's stout and stdin and stderr
	ctx = context.WithValue(ctx, "stdin", p.stdin)
	ctx = context.WithValue(ctx, "stdout", p.stdout)
	// ctx = context.WithValue(ctx, "srderr", p.srderr)

	return flow.ExecuteWithContext(ctx, p.step)
}

func (p *plug) close(ctx context.Context) error {
	return p.closeStdio()
}
