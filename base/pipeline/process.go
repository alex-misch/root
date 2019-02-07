package pipeline

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"

	"github.com/boomfunc/root/base/tools"
	"github.com/boomfunc/root/tools/log"
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
	return nil
}

// check method guarantees that the object can be launched at any time
// process is piped
func (p *process) check(ctx context.Context) error {
	return p.checkStdio()
}

// NOTE: this kind also hungs - problem not here!!!!
// TODO: keep this file original, problem not here
// TODO here is very tmp solution of stderr, look something better
// TODO: maybe all flow run through executor?
func (p *process) run(ctx context.Context) error {
	stderr := new(bytes.Buffer)

	// fill templates from ctx
	parts := tools.CLISplit(
		tools.StringFromCtx(ctx, p.cmd),
	)

	// create command with cancel functinality
	cmd := exec.CommandContext(ctx, parts[0], parts[1:]...)
	cmd.Stdin = p.stdin
	cmd.Stdout = p.stdout
	cmd.Stderr = stderr

	if cmd.Process == nil {
		if err := cmd.Start(); err != nil {
			return fmt.Errorf("base/pipeline/process: %s", err)
		}
	}

	// exit code resolves here
	// additionally fetch some information from stderr
	if err := cmd.Wait(); err != nil {
		return fmt.Errorf("base/pipeline/process: %s\n%s", err, stderr)
	}

	// exit code = 0 and stderr nonempty - we have debug information, translate this
	if stderr.Len() > 0 {
		log.Debugf("base/pipeline/process: %s", stderr)
	}

	return nil
}

func (p *process) close(ctx context.Context) error {
	return p.closeStdio()
}
