package poller

// https://people.freebsd.org/~jlemon/papers/kqueue.pdf

const (
	MaxEvents = 1024 // TODO max events???
)

type Event interface {
	Fd() uintptr
}

type Interface interface {
	Add(fd uintptr) error
	Del(fd uintptr) error
	Events() (re []Event, we []Event, ce []Event, err error)
}
