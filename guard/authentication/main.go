package authentication

import (
	"bytes"
	"errors"

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
	Ask(trust.Node) error
	Answer(trust.Node, []byte) (trust.Node, error)
	// We advise that only information about encryption-decryption mechanics be included into the fingerprint.
	// And not specific runtime generated values.
	trust.Node
}

// tournament describes your own authentication flow
type tournament struct {
	chs    []Challenge    // set of challenges node must pass to be marked as 'authenticated'
	node   trust.Node     // node which tries to authenticate
	getter trust.NodeHook // hook for getting node by `Abstract` node's fingerprint
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

		abstract, err := trust.Open(markers[i], t.chs[i])
		if err != nil {
			break
		}

		if err := t.setNode(abstract); err != nil {
			break
		}

		// if t.node != nil {
		// 	// Case 1. Check i marker valid (challenge passed)
		// 	// try to encode by i challenge (check existence trusting relation)
		// 	// Valid if and only if current tournament's node relates to provided marker
		// 	if err := trust.Check(markers[i], t.chs[i], t.node); err != nil {
		// 		// wrong marker, this challenge undone
		// 		break
		// 	}
		// } else {
		// 	// Case 2. Use the `getter` hook for fetch real node by orphan node
		// 	// try to get orphan node by challenge's fingerprint
		// 	node, err := trust.Open(markers[i], t.chs[i])
		// 	if err != nil {
		// 		break
		// 	}
		// 	if t.getter != nil {
		// 		node, err = t.getter(node)
		// 		if err != nil {
		// 			break
		// 		}
		// 	}
		//
		// 	// We did everything we can to get the node.
		// 	// At least an orphan node is always here
		// 	t.node = node
		// }

	}

	// check for case `node` has passed all challenges
	if len(t.chs) < i+1 {
		return nil
	}

	// We calculated nearest undone challenge, return this
	return t.chs[i]
}

// setNode trying to update node in tournament
// there is some cases when it is impossible
func (t *tournament) setNode(node trust.Node) error {
	// The main idea is that it is possible to set an updated node
	// only if it has the same fingerprint as the old.
	// After the .Ask() or .Answer() operations the null node cannot be returned
	if node == nil {
		return trust.ErrWrongNode
	}

	// The only way we can set node to authentication tournament - she was not there yet
	if t.node == nil {
		// we got abstract (not verified) non-nil node
		// try to get real verified node via getter hook
		if t.getter != nil {
			real, err := t.getter(node)
			if err != nil {
				return err
			}
			node = real
		}

		// set ONLY verified node to tournament
		t.node = node
		return nil
	}

	// TODO: maybe replace? if fingerprint equal real node may be different with absract
	// Another case, node already in tournament, check for fingerprint identity
	if !bytes.Equal(t.node.Fingerprint(), node.Fingerprint()) {
		return trust.ErrWrongMarker
	}

	return nil
}

// Ask is the first part of the challenge - ask node for some answer
// generate question, save it
func (t *tournament) Ask(markers []Marker) error {
	// Phase 1. Try to get nearest undone challenge
	challenge := t.get(markers)
	if challenge == nil {
		// node authenticated without any challenges
		// nothing to do
		return Complete
	}

	// Phase 2. Undone challenge found, let's ask node for answer
	// NOTE: be careful: asks for answer from nearest undone challenge
	return challenge.Ask(t.node)
}

// Answer is the second part of the challenge - check answer from node
// fetch question from .Ask() and validate it with answer
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
	// second opportunity to update node in session
	if err := t.setNode(node); err != nil {
		return nil, err
	}

	// Phase 4.
	// Answer was wright
	// Challenge passed.
	// Return marker as achievement.
	return NewMarker(challenge, t.node)
}

// Check try to authenticate the node by provided markers
// returns authentication. Failed if this is not possible.
func (t *tournament) Check(markers []Marker) (trust.Node, error) {
	if challenge := t.get(markers); challenge == nil {
		// node authenticated without any challenges
		// nothing to do
		return t.node, nil
	}

	return nil, Failed
}
