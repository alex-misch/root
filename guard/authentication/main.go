package authentication

import (
	"errors"

	"github.com/boomfunc/root/guard/trust"
)

var (
	// ErrChallengeFailed is common error for fail cases in challenges
	ErrChallengeFailed = errors.New("guard/authentication: Challenge lifecycle failed")
)

// Challenge is the way to achieve Marker
// used as a part of authentication flow (tournament)
type Challenge interface {
	Ask(Channel) error
	Check(trust.Node, interface{}) error
	trust.Node
}

// tournament describes your own authentication flow
type tournament struct {
	chs  []Challenge    // set of challenges node must pass to be marked as 'authenticated'
	node trust.Node     // node which tries to authenticate
	hook trust.NodeHook // hook for validating inner trust node
}

// Tournament creates and returns new authentication tournament
func Tournament(flow []Challenge, hook trust.NodeHook) *tournament {
	return &tournament{
		chs:  flow,
		hook: hook,
	}
}

// Get returns nearest non passed challenge
// by provided markers chain
func (t *tournament) Get(markers []Marker) Challenge {
	// Prephase. Checks
	if len(t.chs) == 0 {
		// empty flow, no challenges for user
		return nil
	}

	// index of current active challenge
	var i int

	// iterate over markers and chain of challenges
	for ; i < len(t.chs); i++ {
		// Phase 1. Check does i marker exists
		if len(markers) < i+1 {
			// i marker does not exists, current challenge undone
			break
		}

		// Phase 2. Try to get node that wants to authenticate
		// or check that marker is valid for current existing node
		if t.node != nil {
			// Check i marker valid (challenge passed)
			// try to encode by i challenge (check existence trusting relation)
			if err := trust.Check(markers[i], t.chs[i], t.node); err != nil {
				// wrong marker, this challenge undone
				break
			}
		} else {
			// try to get node by challenge's fingerprint
			node, err := trust.Open(markers[i], t.chs[i])
			if err != nil {
				break
			}
			if t.hook != nil {
				node, err = t.hook(node)
				if err != nil {
					break
				}
			}
			t.node = node
		}
	}

	// check for case `node` has passed all challenges
	if len(t.chs) < i+1 {
		return nil
	}

	// We calculated nearest undone challenge, return this
	return t.chs[i]
}

// Ask is the first part of the challenge - ask node for some answer
func (t *tournament) Ask(markers []Marker) error {
	// Phase 1. Try to get nearest undone challenge
	if challenge := t.Get(markers); challenge != nil {
		// challenge accepted, ask user for answer
		return challenge.Ask(nil)
	}

	// user authenticated without any challenges
	// nothing to ask
	return nil
}

// Check is the second part of the challenge - check answer from node
func (t *tournament) Check(markers []Marker, answer interface{}) (Marker, error) {
	if challenge := t.Get(markers); challenge != nil {
		// undone challenge found, let's check node answer
		// NOTE: answer will be checked by nearest undone challenge
		if err := challenge.Check(t.node, answer); err != nil {
			// wrong answer
			return nil, err
		}

		// check was successful, challenge passed, return marker
		return NewMarker(challenge, t.node)
	}

	// user authenticated without any challenges
	return nil, nil
}
