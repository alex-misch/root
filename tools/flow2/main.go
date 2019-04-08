package flow2

import (
	"context"
	"os"
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
type Filer interface {
	File() (*os.File, error)
}

// Step interface describes something that can be runned in some flow
type Step interface {
	Run(context.Context, Filer, Filer) error
}
