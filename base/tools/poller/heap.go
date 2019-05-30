package poller

import (
	"container/heap"
	"fmt"
	"sync"
)

// HeapItem describes simple pollable object
type HeapItem struct {
	Fd    uintptr
	Value interface{}
	ready bool
}

// String implements fmt.Stringer interface
func (item HeapItem) String() string {
	return fmt.Sprintf("HeapItem(fd=%d, ready=%t)", item.Fd, item.ready)
}

type pollerHeap struct {
	mutex   sync.Mutex // this mutex guards variables below
	poller  Interface  // poller intergration
	ponce   *sync.Once // poller invoking only once per time
	pcond   *sync.Cond // poller ready (waiting) condition
	pending []*HeapItem
}

// HeapWithPoller creates instance of heap.Interface with poller background refresh
// the provided poller will be used
func HeapWithPoller(poller Interface) (heap.Interface, error) {
	h := new(pollerHeap)
	h.poller = poller
	h.ponce = new(sync.Once)
	h.pcond = sync.NewCond(&h.mutex)
	h.pending = make([]*HeapItem, 0)

	heap.Init(h)
	return h, nil
}

// Heap creates instance of heap.Interface with poller background refresh
// poller will be selected based on OS
func Heap() (heap.Interface, error) {
	poller, err := New()
	if err != nil {
		return nil, err
	}

	return HeapWithPoller(poller)
}

func (h *pollerHeap) len() int {
	return len(h.pending)
}

// Len implements the sort.Interface
func (h *pollerHeap) Len() int {
	h.mutex.Lock()
	n := h.len()
	h.mutex.Unlock()

	return n
}

// Less implements the sort.Interface
func (h *pollerHeap) Less(i, j int) bool {
	return false
}

// Swap implements the sort.Interface
func (h *pollerHeap) Swap(i, j int) {
	return
}

// Push implements the heap.Interface
// adds pollable element to poller
//
// TODO errors not visible to caller
func (h *pollerHeap) Push(x interface{}) {
	// Phase 1. Convert object to pollable itemю
	fd, err := FD(x)
	if err != nil {
		return
	}
	item := &HeapItem{Fd: fd, Value: x}

	// Phase 2. Received object is pollable - push it to the poller and heapю
	h.mutex.Lock()

	// try to add to poller
	if err := h.poller.Add(item.Fd); err == nil {
		// fd in poller, store it for .Pop()
		h.pending = append(h.pending, item)
	}

	h.mutex.Unlock()
}

// Pop implements heap.Interface
// pops first in flow with `ready` status
func (h *pollerHeap) Pop() interface{} {
	for {
		// background poll refresh
		go h.Poll()

		h.pcond.L.Lock()

		// Try to pop ready item and return it if nonnil.
		if value := h.pop(); value != nil {
			// found ready non nil item, return it
			h.pcond.L.Unlock()
			return value
		}

		// no ready event found, wait for nearest polling
		// create polling assistance and wait for it
		go h.Poll()
		h.pcond.Wait()

		h.pcond.L.Unlock()
	}
}

// poll is the main link between heap and core poller
// blocking operation until really received some events
// otherwise poll again
func (h *pollerHeap) poll() ([]uintptr, []uintptr) {
	var re, ce []Event

	for {
		var err error
		// fetching events from poller
		// blocking mode !!!
		re, ce, err = h.poller.Events()
		if err != nil {
			// some error from poller -> poll again
			continue
		}

		if len(re)+len(ce) == 0 {
			// not required events came -> poll again
			continue
		}

		// all fetched without errors
		return EventsToFds(re...), EventsToFds(ce...)
	}
}

// Poll is thread safety operation for waiting events from poller and actualize heap data.
// NOTE: Poll may be invoked as many times as wants - only one instance of this will be really invoked
func (h *pollerHeap) Poll() {
	// f is the polling process with actualizing heap data.
	// Only one running instance of this function per time across all workers -> under Once.Do
	f := func() {
		// blocking mode operation !!
		re, ce := h.poll()

		// events are received (and they are!)
		h.mutex.Lock()
		h.actualize(re, ce)      // push ready, excluding closed
		h.pcond.Broadcast()      // tell waiting to continue working with .Pop(0)
		h.ponce = new(sync.Once) // reset once condition after successful polling
		h.mutex.Unlock()
	}

	// f invokes with mutex locking on once.Do layer
	// but once.m is a different mutex than h.mutex
	// -> f() not thread safety
	h.mutex.Lock()
	ponce := h.ponce
	h.mutex.Unlock()

	ponce.Do(f)
}

// actualize called after success polling process finished
// purpose: update state (add new ready, delete closed)
func (h *pollerHeap) actualize(ready []uintptr, close []uintptr) {
	filtered := exclude(h.pending, close)
	mapped := setReady(filtered, ready)

	h.pending = mapped
}

// pop searches first entry in `pending` slice
// which has `ready` flag == true
func (h *pollerHeap) pop() interface{} {
	if h.len() == 0 {
		return nil
	}

	// there is something to pop (at first sight)
	// get first fd from heap, available in pending
	for i, item := range h.pending {
		if item.ready {
			h.pending = append(h.pending[:i], h.pending[i+1:]...)
			return item.Value
		}
	}

	// nobody ready
	return nil
}
