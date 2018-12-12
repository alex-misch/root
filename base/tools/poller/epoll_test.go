// +build linux

package poller

import (
	"fmt"
	"os"
	"testing"

	"golang.org/x/sys/unix"
)

func TestPollerPrivate(t *testing.T) {
	poller, err := New()
	epoll, ok := poller.(*epoll)

	t.Run("New", func(t *testing.T) {
		if err != nil {
			t.Fatal(err)
		}
		if !ok {
			t.Fatal("Unexpected poller type (expected *epoll)")
		}
		if epoll.fd <= 0 {
			t.Fatal("Invalid poller fd")
		}
	})

	t.Run("wait", func(t *testing.T) {
		r1, w1, _ := os.Pipe()
		r2, w2, _ := os.Pipe()
		epoll.Add(r1.Fd())
		epoll.Add(w1.Fd())
		epoll.Add(r2.Fd())
		epoll.Add(w2.Fd())

		// now nothing available
		// first pipe - write, second pipe - close
		fmt.Fprint(w1, "some playload")
		w2.Close()

		events, err := epoll.wait()
		if err != nil {
			t.Fatal(err)
		}

		if len(events) != 2 {
			t.Fatal("Unexpected number of events, expected 2")
		}
	})
}

func TestToEvent(t *testing.T) {
	se := unix.EpollEvent{Fd: 6}

	event := toEvent(se)

	if event.Fd() != 6 {
		t.Fatal("Unexpected event fd")
	}
}
