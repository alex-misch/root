package poller

import (
	"container/heap"
	// "reflect"
	"sync"

	"github.com/boomfunc/root/base/tools"
	// "github.com/boomfunc/log"
)

type HeapItem struct {
	Fd    uintptr
	Value interface{}
	ready bool
}

type pollerHeap struct {
	// poller integration
	poller Interface
	once   tools.Once // poller locking
	wg     sync.WaitGroup

	// mutex and state
	mutex   sync.Mutex // this mutex guards variables below
	pending []*HeapItem
}

// HeapWithPoller creates instance of heap.Interface with poller background refresh
// the provided poller will be used
func HeapWithPoller(poller Interface) (heap.Interface, error) {
	h := new(pollerHeap)
	h.poller = poller
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

func (h *pollerHeap) Len() int {
	h.mutex.Lock()
	n := h.len()
	h.mutex.Unlock()

	return n
}

func (h *pollerHeap) less(i, j int) bool {
	// Less reports whether the element with
	// index i should sort before the element with index j.
	if !h.pending[i].ready && h.pending[j].ready {
		return true
	}
	return false
}

func (h *pollerHeap) Less(i, j int) bool {
	return false
	// h.mutex.RLock()
	// b := h.less(i, j)
	// h.mutex.RUnlock()
	//
	// return b
}

func (h *pollerHeap) swap(i, j int) {
	if h.len() >= 2 {
		// there is something to swap
		h.pending[i], h.pending[j] = h.pending[j], h.pending[i]
	}
}

func (h *pollerHeap) Swap(i, j int) {
	return
	// h.mutex.Lock()
	// h.swap(i, j)
	// h.mutex.Unlock()
}

// Pop implements heap.Interface
// adds flow to poller
func (h *pollerHeap) Push(x interface{}) {
	if item, ok := x.(*HeapItem); ok {
		h.mutex.Lock()

		// try to add to poller
		if err := h.poller.Add(item.Fd); err == nil {
			// fd in poller, store it for .Pop()
			h.pending = append(h.pending, item)
		} else {
			// TODO error not visible! in transport layer
		}

		h.mutex.Unlock()
	}
}

// Pop implements heap.Interface
// pops first in flow with `ready` status
func (h *pollerHeap) Pop() interface{} {
	for {
		// TODO: loop infinity
		// h.wg.Add(1)

		// background poll refresh
		go h.Poll()

		// try to pop ready
		h.mutex.Lock()
		value := h.pop()
		h.mutex.Unlock()

		if value != nil {
			return value
		} else {
			h.wg.Wait()
			// log.Debug("h.wg.Wait():", reflect.ValueOf(&h.wg).Pointer())
		}
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
		re, _, ce, err = h.poller.Events()
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

// Poll is thread safety operation for waiting events from poller
// and actualize heap data
func (h *pollerHeap) Poll() {
	// f is poll with actualizing heap data
	// Only one running instance of this function per time across all workers
	f := func() {
		h.mutex.Lock()
		h.wg.Add(1) // set waiters wait for this polling
		// log.Debug("h.wg.Add(1):", reflect.ValueOf(&h.wg).Pointer())
		h.mutex.Unlock()

		// blocking mode operation !!
		re, ce := h.poll()

		// events are received (and they are!)
		h.mutex.Lock()
		h.actualize(re, ce) // push ready, excluding closed
		h.mutex.Unlock()

		h.mutex.Lock()
		h.wg.Done() // release waiting
		// log.Debug("h.wg.Done():", reflect.ValueOf(&h.wg).Pointer())
		h.mutex.Unlock()
	}

	// f invokes with mutex locking on once.Do layer
	// but once.m is a different mutex than h.mutex
	// -> f() not thread safety
	h.once.Do(f, true)
}

// actualize called after success polling process finished
// purpose: update state (add new ready, delete closed)
func (h *pollerHeap) actualize(ready []uintptr, close []uintptr) {
	filtered := pendingFilterClosed(h.pending, close)
	mapped := pendingMapReady(filtered, ready)

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
