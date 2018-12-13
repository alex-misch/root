package poller

import (
	"container/heap"
	"fmt"
	"sync"
	"sync/atomic"

	"github.com/boomfunc/root/base/tools"
)

type HeapItem struct {
	Fd    uintptr
	Value interface{}
	ready bool
}

// String implements fmt.Stringer interface
func (item *HeapItem) String() string {
	return fmt.Sprintf("HeapItem(fd: %d, value: %v, ready: %t)", item.Fd, item.Value, item.ready)
}

type pollerHeap struct {
	// poller integration
	// and sync locking section
	poller  Interface
	once    tools.Once // poller invoking only once per time
	cond    *sync.Cond // poller ready (waiting) condition
	waiting uint32     // special int indicating that now some routine is waiting for broadcasting from .Poll()

	// mutex and state
	mutex   sync.Mutex // this mutex guards variables below
	pending []*HeapItem
}

// HeapWithPoller creates instance of heap.Interface with poller background refresh
// the provided poller will be used
func HeapWithPoller(poller Interface) (heap.Interface, error) {
	h := new(pollerHeap)
	h.poller = poller
	h.cond = sync.NewCond(new(sync.Mutex))
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

// Push implements heap.Interface
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
		// background poll refresh
		go h.Poll()

		// try to pop ready
		h.mutex.Lock()
		value := h.pop()
		h.mutex.Unlock()

		// check for wait
		if value != nil {
			return value
		}

		// we checked fetched value and it is not valid -. we need to wait for nearest polling
		h.PollWait()
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

// Poll is thread safety operation for waiting events from poller
// and actualize heap data
// NOTE: Poll may be invoked as many times as wants - only one instance of this will be really invoked
func (h *pollerHeap) Poll() {
	// f is poll with actualizing heap data
	// Only one running instance of this function per time across all workers -> under Once.Do
	f := func() {
		// blocking mode operation !!
		re, ce := h.poll()

		// events are received (and they are!)
		h.mutex.Lock()
		h.actualize(re, ce) // push ready, excluding closed
		h.mutex.Unlock()
	}

	// f invokes with mutex locking on once.Do layer
	// but once.m is a different mutex than h.mutex
	// -> f() not thread safety
	// NOTE: only real invokes of .poll() (real Once.Do) can release waiting goroutines
	// NOTE: and! only if some waiters exists
	if h.once.DoReset(f) && atomic.LoadUint32(&h.waiting) == 1 {
		// set flag back to nonwait
		h.mutex.Lock()
		h.waiting = 0
		h.mutex.Unlock()

		// broadcasr waiters (all) (no care about multiple invokes)
		h.cond.Broadcast()
	}
}

// PollWait is special tool ths will block until some instance of .Poll() wake up by throwing a broadcast signal
func (h *pollerHeap) PollWait() {
	h.cond.L.Lock() // NOTE: this guarantees that h.cond.Wait() will be called before h.cond.Broadcast()
	defer h.cond.L.Unlock()

	go func() {
		h.cond.L.Lock() // NOTE: this will wait for h.cond.Wait()
		defer h.cond.L.Unlock()

		// we waiting broadcasting signal (signal wake up waiting)
		h.mutex.Lock()
		h.waiting = 1
		h.mutex.Unlock()

		// run helper instance of polling (event if it will faked waiting flag set to 1)
		// NOTE: it is just companion for case when now is no .Poll() is running
		h.Poll()
	}()

	h.cond.Wait()
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
