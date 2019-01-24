package kvs

import (
	"sync"
)

type Namespace struct {
	mutex   sync.Mutex             // this mutex guards variables below
	pending map[string]*sync.Cond  // pending is keys that somebody is waiting for
	dirty   map[string]interface{} // inner store
}

// NewNamespace initialize and returns new key-value separate database's namespace
func NewNamespace() *Namespace {
	return &Namespace{
		pending: make(map[string]*sync.Cond, 0),
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

// set stores value by key
// private api
// not thread safety
func (ns *Namespace) set(key string, value interface{}) {
	ns.dirty[key] = value
}

// Set stores value by key
// if somebody wait for value - send signal and
func (ns *Namespace) Set(key string, value interface{}) {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()

	// set value
	ns.set(key, value)

	// also check for pending
	if cond, ok := ns.pending[key]; ok && cond != nil {
		cond.Broadcast()
		// garbage
		delete(ns.pending, key)
	}
}

// Wait is for waiting nearest .Set() invokes for provided key
func (ns *Namespace) Wait(key string) {
	ns.mutex.Lock()

	cond := ns.pending[key]

	if cond == nil { // check for existsing waiting condition in pending
		// condition not exists, or no wait invokes before - create new cond
		cond = sync.NewCond(&sync.Mutex{})
		ns.pending[key] = cond // save cond to future use
	}

	ns.mutex.Unlock()

	// freeze thread for waiting broadcast
	// NOTE: namespace mutex unlocked, so we don't lock for another operations
	cond.L.Lock()
	cond.Wait()
	cond.L.Unlock()
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
