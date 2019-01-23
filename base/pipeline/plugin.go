package pipeline

import (
	"context"
	"plugin"

	"github.com/boomfunc/root/tools/flow"
)

type Plugin struct {
	path string
	name string

	stdio
}

func NewPlugin(path, name string) *Plugin {
	return &Plugin{path: path, name: name}
}

func (p *Plugin) copy() Layer {
	clone := *p
	return &clone
}

func (p *Plugin) prepare(ctx context.Context) error {
	return nil
}

func (p *Plugin) check(ctx context.Context) error {
	// check layer piped
	if err := p.checkStdio(); err != nil {
		return err
	}

	return nil
}

func (p *Plugin) run(ctx context.Context) error {
	// 1. open the so file to load the symbols
	pl, err := plugin.Open(p.path)
	if err != nil {
		return err
	}

	// 2. look up a symbol (an exported function or variable)
	sym, err := pl.Lookup(p.name)
	if err != nil {
		return err
	}

	// 3. Assert that loaded symbol is of a desired type
	// step, ok := sym.(flow.Step)
	step, err := flow.ToStep(sym)
	if err != nil {
		return err
	}

	ctx = context.WithValue(ctx, "stdin", p.stdin)
	ctx = context.WithValue(ctx, "stdout", p.stdout)

	// 4. run
	return step.Run(ctx)
}

func (p *Plugin) close(ctx context.Context) error {
	return p.closeStdio()
}
