package poller

import (
	"container/heap"
	"net"
)

// set of tools to integrate poller with the net.Listener interface

// listener is the wrapper type
type listener struct {
	h heap.Interface
	l net.Listener
}

// Listener wraps net.Listener with poller logic.
// Only read-ready connections will be returned by .Accept().
func Listener(l net.Listener) (net.Listener, error) {
	h, err := Heap()
	if err != nil {
		return nil, err
	}

	l = &listener{h, l}
	return l, nil
}

func (l *listener) Accept() (net.Conn, error) {
	// create synchronization channels...
	errCh := make(chan error)
	connCh := make(chan net.Conn)
	// ... and close after conn returned
	defer func() {
		close(errCh)
		close(connCh)
	}()

	// use underlying listerner to get conn and push to poller
	go func() {
		for {
			conn, err := l.l.Accept()
			if err != nil {
				errCh <- err
				break
			}
			heap.Push(l.h, conn)
		}
	}()

	// Only ready events will be returned
	go func() {
		for {
			if conn, ok := heap.Pop(l.h).(net.Conn); ok {
				connCh <- conn
				break
			}
		}
	}()

	// listen channels
	select {
	case err := <-errCh:
		return nil, err
	case conn := <-connCh:
		return conn, nil
	}
}

func (l *listener) Close() error {
	return l.l.Close()
}

func (l *listener) Addr() net.Addr {
	return l.l.Addr()
}
