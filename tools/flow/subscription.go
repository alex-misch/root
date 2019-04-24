package flow

import (
	"sync"
)

var (
	subscribers *subscription
)

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
	if subscribers == nil {
		subscribers = &subscription{
			pending: make(map[Step]*sync.Cond, 0),
		}
	}

	subscribers.waitFor(step)
}

// Broadcast unlocks all step's subscribers
func Broadcast(step Step) {
	if subscribers == nil {
		subscribers = &subscription{
			pending: make(map[Step]*sync.Cond, 0),
		}
	}

	subscribers.broadcast(step)
}

// Clear clears all subscriber relations
func Clear(step Step) {
	// TODO: maybe broadcast current pending?
	subscribers = nil
}
