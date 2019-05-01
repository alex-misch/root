package authentication

import (
	"bytes"
	"errors"

	"github.com/boomfunc/root/guard/authentication/channel"
	"github.com/boomfunc/root/guard/trust"
)

var (
	// ErrChallengeFailed is common error for fail cases in challenges
	ErrChallengeFailed = errors.New("guard/authentication: Challenge lifecycle failed")
	// Complete means that authentication tournament complete
	// we can use tournament.node for authorization part
	Complete = errors.New("guard/authentication: Tournament (authentication flow) complete")
	// Failed means that tournament requires some challenges to be completed
	Failed = errors.New("guard/authentication: Tournament (authentication flow) failed")
)

// Challenge is the way to achieve Marker
// used as a part of authentication flow (tournament)
type Challenge interface {
	Ask(channel.Interface) error
	Answer(trust.Node, []byte) (trust.Node, error)
	// We advise that only information about encryption-decryption mechanics be included into the fingerprint.
	// And not specific runtime generated values.
	trust.Node
}

// tournament describes your own authentication flow
type tournament struct {
	chs    []Challenge    // set of challenges node must pass to be marked as 'authenticated'
	node   trust.Node     // node which tries to authenticate
	getter trust.NodeHook // hook for getting node by orphan node's fingerprint
}

// Tournament creates and returns new authentication tournament
func Tournament(flow []Challenge, getter trust.NodeHook) *tournament {
	return &tournament{
		chs:    flow,
		getter: getter,
	}
}

// get returns nearest non passed challenge
// by provided markers chain
func (t *tournament) get(markers []Marker) Challenge {
	// Prephase. Checks
	if len(t.chs) == 0 {
		// empty flow, no challenges for node
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

		// Phase 2.
		// there may be 2 states:
		// 1. We know for which node the tournament is running
		// 2. The opposite
		//
		// Anyway we need to try to fetch this node.
		// Case when it is impossible: no markers provided (initial sign-in state)
		//
		// Anyway if node unfetchable - no markers will be generated
		// But first Challenge must ALWAYS able to fetch node by answer as a last resort
		if t.node != nil {
			// Case 1. Check i marker valid (challenge passed)
			// try to encode by i challenge (check existence trusting relation)
			// Valid if and only if current tournament's node relates to provided marker
			if err := trust.Check(markers[i], t.chs[i], t.node); err != nil {
				// wrong marker, this challenge undone
				break
			}
		} else {
			// Case 2. Use the `getter` hook for fetch real node by orphan node
			// try to get orphan node by challenge's fingerprint
			node, err := trust.Open(markers[i], t.chs[i])
			if err != nil {
				break
			}
			if t.getter != nil {
				node, err = t.getter(node)
				if err != nil {
					break
				}
			}

			// We did everything we can to get the node.
			// At least an orphan node is always here
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
	challenge := t.get(markers)
	if challenge == nil {
		// node authenticated without any challenges
		// nothing to do
		return Complete
	}

	// Phase 2. Undone challenge found, let's ask node for answer
	// TODO: here is no node - what channel??
	return challenge.Ask(
		channel.SMTP(),
	)
}

// Answer is the second part of the challenge - check answer from node
func (t *tournament) Answer(markers []Marker, answer []byte) (Marker, error) {
	// Phase 1. Try to get nearest undone challenge
	challenge := t.get(markers)
	if challenge == nil {
		// node authenticated without any challenges
		// nothing to do
		return nil, Complete
	}

	// Phase 2. Undone challenge found, let's check node answer
	// NOTE: be careful: answer will be checked by nearest undone challenge
	node, err := challenge.Answer(t.node, answer)
	if err != nil {
		// wrong answer
		return nil, err
	}

	// Phase 3. Check modified node with in-session node
	if t.node == nil {
		if node == nil {
			return nil, ErrChallengeFailed
		}
		t.node = node
	} else {
		// here node already in tournament, we can only check
		if node == nil || !bytes.Equal(t.node.Fingerprint(), node.Fingerprint()) {
			return nil, ErrChallengeFailed
		}
	}

	// check was successful, challenge passed, return marker
	return NewMarker(challenge, t.node)
}

func (t *tournament) Check(markers []Marker) (trust.Node, error) {
	if challenge := t.get(markers); challenge == nil {
		// node authenticated without any challenges
		// nothing to do
		return t.node, nil
	}

	return nil, Failed
}
