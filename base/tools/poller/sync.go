package poller

import (
	"sync"
	"sync/atomic"
)

// locker is simple sync.Locker changing uint from 0 to 1 and back
type locker struct {
	mutex  sync.Mutex // this mutex guards variables below
	locked uint32
}

// Lock implements sync.Locker interface
// works by check - lock - check
func (l *locker) Lock() {
	// check
	if atomic.LoadUint32(&l.locked) == 1 {
		return
	}

	// lock
	l.mutex.Lock()
	defer l.mutex.Unlock()

	// check
	if l.locked == 0 {
		atomic.StoreUint32(&l.locked, 1)
	}
}

// Unlock implements sync.Locker interface
// works by check - lock - check
func (l *locker) Unlock() {
	// check
	if atomic.LoadUint32(&l.locked) == 0 {
		return
	}

	// lock
	l.mutex.Lock()
	defer l.mutex.Unlock()

	// check
	if l.locked == 1 {
		atomic.StoreUint32(&l.locked, 0)
	}
}
