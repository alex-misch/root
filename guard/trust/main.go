package trust

import (
	"bytes"
	"errors"
)

var (
	// ErrWrongMarker describes something went wrong during decrypting data
	ErrWrongMarker = errors.New("guard/trust: Wrong `marker` provided")
	// ErrWrongNode describes situation where node cannot be a part of the relation
	ErrWrongNode = errors.New("guard/trust: Wrong `node` provided for trust relation")
)

// Node describs object who can trust another same object
// and seal this trust relation with your fingerprint
type Node interface {
	Fingerprint() []byte
}

// NodeHook is some kind of intermediate hook for validating node
type NodeHook func(Node) (Node, error)

// Open decrypt marker and return inner fingerprint as Node interface
func Open(marker []byte, from Node) (Node, error) {
	// Prephase. checks
	if from == nil {
		return nil, ErrWrongNode
	}

	// Phase 1. Try to decrypt marker
	raw, err := decrypt(
		marker,                               // encrypted marker to check
		createPassphrase(from.Fingerprint()), // create passphrase as crypto key
	)

	if err != nil {
		return nil, ErrWrongMarker
	}

	// Phase 2. Raw fingerprint exists, return dummy interface type
	return Abstract(raw), nil
}

// Check checks the marker for the existence of a trust relationship
func Check(marker []byte, from, to Node) error {
	// Prephase. checks
	if to == nil {
		return ErrWrongNode
	}

	// Phase 1. Try to open the marker
	orphan, err := Open(marker, from)
	if err != nil {
		return err
	}

	// Phase 2. Check raw data
	if !bytes.Equal(orphan.Fingerprint(), to.Fingerprint()) {
		return ErrWrongMarker
	}

	return nil
}

// Create creates trust relationship between two nodes
// with `from -> to` direction
func Create(from, to Node) ([]byte, error) {
	// Prephase. checks
	if from == nil {
		return nil, ErrWrongNode
	}
	if to == nil {
		return nil, ErrWrongNode
	}

	return encrypt(
		to.Fingerprint(),                     // data to encrypt
		createPassphrase(from.Fingerprint()), // create passphrase as crypto key
	)
}
