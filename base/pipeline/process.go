package pipeline

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os/exec"

	"github.com/boomfunc/root/base/tools"
	"github.com/boomfunc/root/tools/log"
)

var (
	ErrProcessInvalidParts = errors.New("base/pipeline/process: invalid command parts")
)

// process is underlying struct describes raw data for process arguments
type process struct {
	cmd   string
	parts *[]string
	stdio
}

// NewProcess returns pipeline.Layer of process type
func NewProcess(cmd string) Layer {
	return &process{
		cmd:   cmd,
		parts: new([]string), // for non nil pointer -> for safe cloning
	}
}

func (p *process) copy() Layer {
	// NOTE: all pointer attributes still refers to `p`
	// for example all clone.parts will refers to same p.parts
	clone := *p
	return &clone
}

func (p *process) prepare(ctx context.Context) error {
	// check parts already splitted from raw command
	if len(*(p.parts)) > 0 {
		return nil
	}

	// not splitted yet, split it
	parts := tools.CLISplit(p.cmd) // split based on shell rules
	// now we need to replace slice items in original slice pointer
	*p.parts = parts

	return nil
}

// check method guarantees that the object can be launched at any time
// process is piped
func (p *process) check(ctx context.Context) error {
	// check layer piped
	if err := p.checkStdio(); err != nil {
		return err
	}

	// check parts already splitted
	if p.parts == nil {
		return ErrProcessInvalidParts
	}

	// at least one part must be (binary)
	if len(*(p.parts)) < 1 {
		return ErrProcessInvalidParts
	}

	return nil
}

// NOTE: this kind also hungs - problem not here!!!!
// TODO: keep this file original, problem not here
// TODO here is very tmp solution of stderr, look something better
// TODO: maybe all flow run through executor?
func (p *process) run(ctx context.Context) error {
	stderr := new(bytes.Buffer)

	// fill parts with context information
	rendered := tools.StringsFromCtx(ctx, *(p.parts))

	// create command with cancel functionality
	cmd := exec.CommandContext(ctx, rendered[0], rendered[1:]...)
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

	// check for real binary path looked up from first cmd invoke
	if cmd.Path != (*(p.parts))[0] {
		(*(p.parts))[0] = cmd.Path
	}

	return nil
}

func (p *process) close(ctx context.Context) error {
	return p.closeStdio()
}
