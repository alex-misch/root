package authentication

import (
	"bytes"

	"github.com/boomfunc/root/guard/trust"
)

// Credentials provides ability to fetch node
type Credentials struct {
	Password []byte
}

// LoginPwdChallenge is simplest challenge based on login-password pair
type LoginPwdChallenge struct {
	// something like algoritms
	// common challenge data
}

// Fingerprint implements trust.Node interface
func (ch LoginPwdChallenge) Fingerprint() []byte {
	return []byte("LoginPwdChallenge")
}

// Ask do nothing
// common usage is the first challenge to fetch node by credentials
func (ch LoginPwdChallenge) Ask(node trust.Node) error { return nil }

// Answer checks user input for this type of challenge
// In fact, check does in storage exists row with provided username and password
func (ch LoginPwdChallenge) Answer(node trust.Node, answer []byte) (trust.Node, error) {
	// Phase 1. Check password from db
	// for fetching from db
	// username = node.Fingerprint()
	// password = answer

	if bytes.NewBuffer(answer).String() == "rootpwd" {
		return trust.Abstract([]byte{1}), nil
	}

	return nil, ErrChallengeFailed
}
