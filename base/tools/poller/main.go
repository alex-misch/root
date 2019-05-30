package poller

import (
	"os"
)

// https://people.freebsd.org/~jlemon/papers/kqueue.pdf

const (
	MaxEvents = 1024 // TODO max events???
)

type Event interface {
	Fd() uintptr
}

// Filer desctibes object that have underlying file resource
type Filer interface {
	File() (*os.File, error)
}

// Interface is the base interface describes integration with os based event listener
type Interface interface {
	Add(fd uintptr) error
	Del(fd uintptr) error
	Events() (re []Event, ce []Event, err error)
}
