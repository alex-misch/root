package pipeline

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"strings"

	"github.com/boomfunc/root/base/tools"
)

type process struct {
	cmd string
	// cmd exec.Cmd

	stdio
}

func NewProcess(cmd string) *process {
	return &process{cmd: cmd}
}

func (p *process) copy() Layer {
	clone := *p
	return &clone
}

func (p *process) prepare(ctx context.Context) error {
	// p.cmd.Stdin = p.stdin
	// p.cmd.Stdout = p.stdout
	//
	// if p.cmd.Process == nil {
	// 	if err := p.cmd.Start(); err != nil {
	// 		return err
	// 	}
	// }

	return nil
}

// check method guarantees that the object can be launched at any time
// process is piped
func (p *process) check(ctx context.Context) error {
	// check layer piped
	if err := p.checkStdio(); err != nil {
		return err
	}

	// // check command is valid and ready
	// if p.cmd == nil {
	// 	return errors.New("pipeline: Process without underlying exec.Cmd")
	// }

	// check cmd stdio
	// if p.cmd.Stdin == nil || p.cmd.Stdout == nil {
	// 	return errors.New("pipeline: Process's underlying exec.Cmd not piped")
	// }

	// process ready for run
	return nil
}

// TODO here is very tmp solution of stderr, look something better
// TODO: maybe all flow run through executor?
func (p *process) run(ctx context.Context) error {
	stderr := new(bytes.Buffer)

	// fill templates from ctx
	parts := strings.Split(
		tools.StringFromCtx(ctx, p.cmd), " ",
	)

	cmd := exec.Command(parts[0], parts[1:]...)

	cmd.Stdin = p.stdin
	cmd.Stdout = p.stdout
	cmd.Stderr = stderr

	if cmd.Process == nil {
		if err := cmd.Start(); err != nil {
			return err
		}
	}

	if err := cmd.Wait(); err != nil {
		return err
	}

	// check for case exit code = 0, but stderr got something
	if len := stderr.Len(); len > 0 {
		return fmt.Errorf("%s", stderr)
	}

	return nil
}

func (p *process) close(ctx context.Context) error {
	// defer func() {
	// 	p.cmd = nil
	// }()

	return p.closeStdio()

	// defer func() {
	// 	if err != nil {
	// 		p.closeStdio()
	// 	} else {
	// 		err = p.closeStdio()
	// 	}
	// }()
	//
	// return
}
