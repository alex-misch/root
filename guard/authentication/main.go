package authentication

import (
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
	Ask(trust.ArtifactHook, trust.Node) error
	Answer(trust.ArtifactHook, trust.Node, []byte) (trust.Node, error)
	// We advise that only information about encryption-decryption mechanics be included into the fingerprint.
	// And not specific runtime generated values.
	trust.Node
}

// tournament describes your own authentication flow
type tournament struct {
	chs    []Challenge        // set of challenges node must pass to be marked as 'authenticated'
	node   trust.Node         // node which tries to authenticate
	getter trust.NodeHook     // hook for getting node by `Abstract` node's fingerprint
	save   trust.ArtifactHook // hook for saving artifact to some storage
	fetch  trust.ArtifactHook // hook for fetching artifact from storage
}

// Tournament creates and returns new authentication tournament
func Tournament(flow []Challenge, getter trust.NodeHook, save trust.ArtifactHook, fetch trust.ArtifactHook) *tournament {
	return &tournament{
		chs:    flow,
		getter: getter,
		save:   save,
		fetch:  fetch,
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
		// Phase 1. Check does i's marker exists
		if len(markers) < i+1 {
			// i's marker does not exists, current challenge undone
			break
		}

		// Phase 2.
		// Parse marker and get node's fingerprint
		abstract, err := trust.Open(markers[i], t.chs[i])
		if err != nil {
			break
		}

		// Set node as owner of the tournament
		// If tournament already attached to node - only fingerprint identity will be checked
		if err := t.chown(abstract); err != nil {
			break
		}
	}

	// check for case `node` has passed all challenges
	if len(t.chs) < i+1 {
		return nil
	}

	// We calculated nearest undone challenge, return this
	return t.chs[i]
}

// chown trying to update node in tournament
// there is some cases when it is impossible
func (t *tournament) chown(node trust.Node) error {
	// Two cases of chown: attach new node and try to update
	// 1) Set aby non-nil, verified (throw getter) node
	// 2) Only check the node in tournament and new one have same fingerprint
	if node == nil {
		return trust.ErrWrongNode
	}

	if t.node == nil {
		// Case 1. The only way we can set node to authentication tournament - she was not there yet.
		// We got abstract (not verified) non-nil node.
		if t.getter != nil {
			// Try to get real verified node via getter hook.
			real, err := t.getter(node)
			if err != nil {
				return err
			}
			node = real
		}

		// Set ONLY verified node to tournament.
		t.node = node
		return nil
	}

	// Case 2. Node already in tournament, check for fingerprint identity.
	return trust.SameNodes(t.node, node)
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
	return challenge.Ask(t.save, t.node)
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
	node, err := challenge.Answer(t.fetch, t.node, answer)
	if err != nil {
		// wrong answer
		return nil, err
	}

	// Phase 3. Node answer was wright, but is this node reak owner of tournament?
	if err := t.chown(node); err != nil {
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
