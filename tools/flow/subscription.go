package flow

import (
	"sync"
)

var (
	// TODO: deprecated in favor of the `Session`
	subscribers *subscription
)

func init() {
	Clear()
}

// subscription is system for subscribing to step execution finish
type subscription struct {
	mutex   sync.Mutex          // this mutex guards variables below
	pending map[Step]*sync.Cond // pending is keys that somebody is waiting for
}

func (s *subscription) waitFor(step Step) {
	s.mutex.Lock()

	cond, ok := s.pending[step]
	if ok && cond == nil {
		s.mutex.Unlock()
		// step already finished
		return
	}

	if cond == nil { // check for existing waiting condition in pending
		// condition not exists, or no wait invokes before - create new cond
		cond = sync.NewCond(&sync.Mutex{})
		s.pending[step] = cond // save cond to future use
	}

	s.mutex.Unlock()

	// freeze thread for waiting broadcast
	cond.L.Lock()
	cond.Wait()
	cond.L.Unlock()
}

func (s *subscription) broadcast(step Step) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// check for pending
	if cond, ok := s.pending[step]; ok && cond != nil {
		// unfreeze all waiters
		cond.Broadcast()
	}

	// garbage
	s.pending[step] = nil
}

// WaitFor locks until the step is completed
func WaitFor(step Step) {
	subscribers.waitFor(step)
}

// Broadcast unlocks all step's subscribers
func Broadcast(step Step) {
	subscribers.broadcast(step)
}

// Clear clears all subscriber relations
// TODO: maybe broadcast all current pending items?
func Clear() {
	if subscribers == nil {
		// Re-create all the struct.
		subscribers = &subscription{
			pending: make(map[Step]*sync.Cond, 0),
		}
	} else {
		// Just re-create map.
		// TODO: very tmp solution.
		subscribers.mutex.Lock()
		subscribers.pending = make(map[Step]*sync.Cond, 0)
		subscribers.mutex.Unlock()
	}
}
