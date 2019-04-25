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
	return []byte("PwdChallenge")
}

func (ch *LoginPwdChallenge) Ask(channel Channel) error {
	// Phase 1. Generate question
	// TODO??????

	// Phase 2. Send question to user
	// return channel.Send()
	return nil
}

func (ch *LoginPwdChallenge) Check(node trust.Node, aswer interface{}) error {
	// Phase 1. Check password from db
	if node == nil {
		// we have not detected the node, nothing to check
		return ErrChallengeFailed
	}

	if password, ok := aswer.(string); ok && password == "rootpwd" {
		return nil
	}

	return ErrWrongPassword
}
