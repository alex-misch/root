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

// Check checks the marker for the existence of a trust relationship
func Check(marker []byte, from, to Node) bool {
	// Prephase. checks
	if from == nil {
		return false
	}
	if to == nil {
		return false
	}

	// Phase 1. Try to decrypt marker
	raw, err := decrypt(
		marker,                               // encrypted marker to check
		createPassphrase(from.Fingerprint()), // create passphrase as crypto key
	)

	if err != nil {
		return false
	}

	// Phase 2. Check raw data
	return bytes.Equal(raw, to.Fingerprint())
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
