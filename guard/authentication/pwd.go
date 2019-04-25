package authentication

import (
	"errors"

	"github.com/boomfunc/root/guard/trust"
)

var (
	ErrWrongPassword = errors.New("Wrong password")
)

// LoginPwdChallenge is simplest challenge based on login-password pair
type LoginPwdChallenge struct {
	// something like algoritms
	// common challenge data
}

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
	// password raw came from answer
	if password, ok := aswer.(string); !ok {
		return ErrWrongPassword
	} else if password != "rootpwd" {
		return ErrWrongPassword
	}

	return nil
}
