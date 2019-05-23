package flow

// set of tools used to clarify the launch of the code represented as Step interface

import (
	"io"
)

// Filer is interface to get underlying pollable file
// used for describing input and output of step
// for piping, logging
// it is something where we can store step's result
//
// TODO: Examples:
// File
// Pipe
// Logger
// Socket
// type Filer interface {
// 	File() (*os.File, error)
// }

type Options struct {
	stdin  io.Reader
	stdout io.Writer
	stderr io.Writer
}

// NewOptions returns new launch configuration for the Step
func NewOptions(stdin io.Reader, stdout, stderr io.Writer) *Options {
	return &Options{
		stdin:  stdin,
		stdout: stdout,
		stderr: stderr,
	}
}

func (opts *Options) Stdin() io.Reader {
	return opts.stdin
}

func (opts *Options) Stdout() io.Writer {
	return opts.stdout
}

func (opts *Options) Stderr() io.Writer {
	return opts.stderr
}

// Update creates copy of options with modofied attrs.
// Attribute is nil means we need no modification.
func (opts Options) Update(stdin io.Reader, stdout, stderr io.Writer) *Options {
	if stdin != nil {
		opts.stdin = stdin
	}

	if stdout != nil {
		opts.stdout = stdout
	}

	if stderr != nil {
		opts.stderr = stderr
	}

	return &opts
}
