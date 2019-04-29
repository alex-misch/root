package authentication

import (
	"errors"

	"github.com/boomfunc/root/guard/trust"
)

var (
	ErrWrongPassword = errors.New("guard/authentication: Wrong `password` provided")
)

// LoginPwdChallenge is simplest challenge based on login-password pair
type LoginPwdChallenge struct {
	// something like algoritms
	// common challenge data
}

// Fingerprint implements trust.Node interface
func (ch LoginPwdChallenge) Fingerprint() []byte {
	return []byte("LoginPwdChallenge")
}

func (ch *LoginPwdChallenge) Ask(channel Channel) error {
	// Phase 1. Generate question
	// TODO??????

	// Phase 2. Send question to user
	// return channel.Send()
	return nil
}

// Check checks user input for this type of challenge
// In fact, check does in storage exists row with provided username and password
func (ch *LoginPwdChallenge) Check(n trust.Node, answer interface{}) (trust.Node, error) {
	// Phase 1. Check password from db
	// for fetching from db
	// username = node.Fingerprint()
	// password = answer

	if password, ok := answer.(string); ok && password == "rootpwd" {
		return node("1"), nil
	}

	return nil, ErrWrongPassword
}
