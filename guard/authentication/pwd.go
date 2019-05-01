package authentication

import (
	"bytes"
	"fmt"

	"github.com/boomfunc/root/guard/authentication/channel"
	"github.com/boomfunc/root/guard/trust"
)

type nnode string

func (n nnode) Fingerprint() []byte { return []byte(fmt.Sprintf("node.%s", n)) }

// LoginPwdChallenge is simplest challenge based on login-password pair
type LoginPwdChallenge struct {
	// something like algoritms
	// common challenge data
}

// Fingerprint implements trust.Node interface
func (ch LoginPwdChallenge) Fingerprint() []byte {
	return []byte("LoginPwdChallenge")
}

func (ch LoginPwdChallenge) Ask(c channel.Interface) error { return nil }

// Answer checks user input for this type of challenge
// In fact, check does in storage exists row with provided username and password
func (ch LoginPwdChallenge) Answer(node trust.Node, answer []byte) (trust.Node, error) {
	// Phase 1. Check password from db
	// for fetching from db
	// username = node.Fingerprint()
	// password = answer

	if bytes.NewBuffer(answer).String() == "rootpwd" {
		return nnode("1"), nil
	}

	return nil, ErrChallengeFailed
}
