package authentication

import (
	"errors"

	"github.com/boomfunc/root/guard/trust"
)

var (
	ErrWrongPin = errors.New("guard/authentication: Wrong `pin` provided")
)

// PinChallenge is simple pin code verification
type PinChallenge struct{}

// Fingerprint implements trust.Node interface
func (ch PinChallenge) Fingerprint() []byte {
	return []byte("PinChallenge")
}

func (ch *PinChallenge) Ask(channel Channel) error {
	// Phase 1. Generate question
	// pin := 1234

	// Phase 2. Send question to user
	return nil
	// return channel.Send(1234)
}

func (ch *PinChallenge) Check(node trust.Node, aswer interface{}) error {
	if pin, ok := aswer.(int); ok && pin == 1234 {
		return nil
	}

	return ErrWrongPin
}
