package poller

import (
	"errors"
	"os"
)

// set of primitive used for heap

var (
	ErrNotPollable = errors.New("base/tools/poller: Object not pollable.")
)

// exclude returns a new list of items excluding closed events
func exclude(items []*HeapItem, exclude []uintptr) []*HeapItem {
	if items == nil || len(items) == 0 {
		return nil
	}

	new := make([]*HeapItem, 0)

OUTER:
	for _, item := range items {
		for _, exfd := range exclude {
			if item.Fd == exfd {
				// not relevant, delete it from future .Pop()
				// delete = skip from appending
				continue OUTER
			}
		}
		// not excluded - use it
		new = append(new, item)
	}

	return new
}

// setReady iterates over items and set a ready flag
func setReady(items []*HeapItem, ready []uintptr) []*HeapItem {
	if items == nil || len(items) == 0 {
		return nil
	}

OUTER:
	for _, item := range items {
		for _, rfd := range ready {
			if item.Fd == rfd {
				item.ready = true
				continue OUTER
			}
		}
	}

	return items
}

// FD returns fd from object if it pollable
func FD(x interface{}) (uintptr, error) {
	switch typed := x.(type) {
	case Filer:
		// Some objects with underlying file resource.
		// For example: net connections.
		if f, err := typed.File(); err != nil {
			return 0, err
		} else {
			return f.Fd(), nil
		}
	case *os.File:
		// File itself.
		return typed.Fd(), nil
	default:
		// Cannot get fd - not pollable element.
		return 0, ErrNotPollable
	}
}

// TODO: WHY?
func EventsToFds(events ...Event) []uintptr {
	fds := make([]uintptr, len(events))

	for i, event := range events {
		fds[i] = event.Fd()
	}

	return fds
}
