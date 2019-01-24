package kvs

import (
	"sync"
)

type Namespace struct {
	mutex   sync.Mutex                  // this mutex guards variables below
	pending map[string]chan interface{} // pending is keys that somebody is waiting for
	dirty   map[string]interface{}      // inner store
}

// NewNamespace initialize and returns new key-value separate database's namespace
func NewNamespace() *Namespace {
	return &Namespace{
		pending: make(map[string]chan interface{}, 0),
		dirty:   make(map[string]interface{}, 0),
	}
}

// Get returns value stored in key
// if value not exists - return nil
func (ns *Namespace) Get(key string) interface{} {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()

	return ns.dirty[key]
}

// Set stores value by key
// if somebody wait for value - send signal and
func (ns *Namespace) Set(key string, value interface{}) {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()

	// set value
	ns.dirty[key] = value

	// also check for pending
	if ch, ok := ns.pending[key]; ok {
		select {
		case ch <- value:
		default: // for non blocking - nobody waits - no need
		}

		// grabage
		close(ch)
		delete(ns.pending, key)
	}
}

// Wait is for waiting nearest .Set() invokes for provided key
// TODO: look better for a sync.Cond, because we need some broadcast multiple routines
// TODO: current implementation too raw
func (ns *Namespace) Wait(key string) {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()

	if _, ok := ns.dirty[key]; ok {
		// value exists, no need to wait
		return
	} else {
		// add to pending and create channel
		ch := make(chan interface{})
		ns.pending[key] = ch
	}
}

// delete clears value stored in key
// private api
// not thread safety
func (ns *Namespace) delete(key string) {
	delete(ns.dirty, key)
}

// Delete clears value stored in key
func (ns *Namespace) Delete(key string) {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()

	ns.delete(key)
}

// Flush clears all values stored in this namespace
func (ns *Namespace) Flush() {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()

	for key := range ns.dirty {
		ns.delete(key)
	}
}
