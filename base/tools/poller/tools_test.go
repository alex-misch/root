package poller

import (
	"fmt"
	"os"
	"reflect"
	"testing"
)

type fakeEvent struct {
	fd uintptr
}

func (ev fakeEvent) Fd() uintptr {
	return ev.fd
}

func TestEventsToFds(t *testing.T) {
	tableTests := []struct {
		events []Event
		out    []uintptr
	}{
		{[]Event{}, []uintptr{}},
		{[]Event{fakeEvent{1}, fakeEvent{2}, fakeEvent{3}}, []uintptr{1, 2, 3}},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if out := EventsToFds(tt.events...); !reflect.DeepEqual(out, tt.out) {
				t.Fatalf("Expected %v, got %v", tt.out, out)
			}
		})
	}
}

func TestExclude(t *testing.T) {
	tableTests := []struct {
		pending []*HeapItem
		exclude []uintptr
		out     []*HeapItem
	}{
		// nil values
		{nil, []uintptr{1, 2, 3}, nil},
		{[]*HeapItem{}, []uintptr{1, 2, 3}, nil},
		// real values
		{[]*HeapItem{&HeapItem{Fd: 1, ready: true}, &HeapItem{Fd: 4}}, []uintptr{1, 2, 3}, []*HeapItem{&HeapItem{Fd: 4}}},
		{[]*HeapItem{&HeapItem{Fd: 1, ready: true}, &HeapItem{Fd: 4}}, []uintptr{5, 6, 7}, []*HeapItem{&HeapItem{Fd: 1, ready: true}, &HeapItem{Fd: 4}}},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if out := exclude(tt.pending, tt.exclude); !reflect.DeepEqual(out, tt.out) {
				t.Fatalf("Expected %v, got %v", tt.out, out)
			}
		})
	}
}

func TestSetReady(t *testing.T) {
	tableTests := []struct {
		pending []*HeapItem
		ready   []uintptr
		out     []*HeapItem
	}{
		// nil values
		{nil, []uintptr{1, 2, 3}, nil},
		{[]*HeapItem{}, []uintptr{1, 2, 3}, nil},
		// real values
		{[]*HeapItem{&HeapItem{Fd: 1, ready: true}, &HeapItem{Fd: 4}}, []uintptr{1, 2, 3, 4}, []*HeapItem{&HeapItem{Fd: 1, ready: true}, &HeapItem{Fd: 4, ready: true}}},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if out := setReady(tt.pending, tt.ready); !reflect.DeepEqual(out, tt.out) {
				t.Fatalf("Expected %v, got %v", tt.out, out)
			}
		})
	}
}

func TestFD(t *testing.T) {
	tableTests := []struct {
		i   interface{}
		fd  uintptr
		err error
	}{
		{nil, 0, ErrNotPollable},
		{"not pollable", 0, ErrNotPollable},
		{os.Stdin, 0, nil},
		{os.Stdout, 1, nil},
		{os.Stderr, 2, nil},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			fd, err := FD(tt.i)

			if !reflect.DeepEqual(err, tt.err) {
				t.Fatalf("Expected %v, got %v", tt.err, err)
			}

			if fd != tt.fd {
				t.Fatalf("Expected %v, got %v", tt.fd, fd)
			}
		})
	}
}
