// +build darwin dragonfly freebsd netbsd openbsd

package poller

import (
	"golang.org/x/sys/unix"
)

type kqueueEvent struct {
	se unix.Kevent_t // source event
}

// Fd implements base Event interface
func (ev kqueueEvent) Fd() uintptr {
	return uintptr(ev.se.Ident)
}

type kqueue struct {
	fd int
}

func New() (Interface, error) {
	// create kqueue
	fd, err := unix.Kqueue()
	if err != nil {
		return nil, err
	}

	poller := &kqueue{fd}
	return poller, nil
}

func (p *kqueue) Add(fd uintptr) error {
	// Set the file back to non blocking mode since conn.File() sets underlying
	// os.File to blocking mode. This is useful to get conn.Set{Read}Deadline
	// methods still working on source Conn.
	//
	// See https://golang.org/pkg/net/#TCPConn.File
	// See /usr/local/go/src/net/net.go: conn.File()
	if err := unix.SetNonblock(int(fd), true); err != nil {
		return err
	}

	event := unix.Kevent_t{
		Ident:  uint64(fd),
		Filter: unix.EVFILT_READ | unix.EVFILT_WRITE, // available for reading or writing event
		Flags:  unix.EV_ADD | unix.EV_ENABLE | unix.EV_ONESHOT,
	}
	_, err := unix.Kevent(p.fd, []unix.Kevent_t{event}, nil, nil)

	return err
}

func (p *kqueue) Del(fd uintptr) error {
	// NOTE: no matter to delete because unix.EV_ONESHOT in add
	return nil
}

func (p *kqueue) Events() ([]Event, []Event, error) {
	events, err := p.wait()
	if err != nil {
		return nil, nil, err
	}

	// something received, try it
	var re, ce []Event
	for _, event := range events {
		ev := toEvent(event)

		if event.Flags&(unix.EV_EOF) != 0 {
			// closed by peer
			if err := p.Del(ev.Fd()); err == nil {
				unix.Close(int(ev.Fd()))
			}
			ce = append(ce, ev)
		// Check event 'ready to read'
		} else if event.Filter&(unix.EVFILT_READ) != 0 {
			p.Del(ev.Fd())
			re = append(re, ev)
		}
	}

	return re, ce, err
}

func (p *kqueue) wait() ([]unix.Kevent_t, error) {
	events := make([]unix.Kevent_t, MaxEvents)

	// blocking mode
	n, err := unix.Kevent(p.fd, nil, events, nil)
	if err != nil {
		return nil, err
	}

	return events[0:n], nil
}

// special tool for converting os specific event to interface
func toEvent(event unix.Kevent_t) Event {
	return kqueueEvent{event}
}
