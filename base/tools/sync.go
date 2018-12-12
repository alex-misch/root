package tools

import (
	"sync"
	"sync/atomic"
)

// Once is an object that will perform exactly one action
// until Reset is called.
// See http://golang.org/pkg/sync/#Once
type Once struct {
	m    sync.Mutex
	lock uint32
}

// Do simulates sync.Once.Do by executing the specified function
// only once, until Reset is triggered after sucessfull f return.
// See http://golang.org/pkg/sync/#Once
// returns boolean indicates is it real invoke or fake
func (o *Once) Do(f func(), reset bool) bool {
	if atomic.LoadUint32(&o.lock) == 1 {
		return false
	}

	o.m.Lock()
	defer o.m.Unlock()

	if o.lock == 0 {
		atomic.StoreUint32(&o.lock, 1)
		if reset {
			defer atomic.StoreUint32(&o.lock, 0)
		}

		f()

		return true
	}

	return false
}
