package authentication

import (
	"errors"

	"github.com/boomfunc/root/guard/trust"
)

var (
	ErrWrongPin = errors.New("guard/authentication: Wrong `pin` provided")
)

// pin is simple pin code verification
type pin struct {
	length uint // length of the pin code
}

// PinChallenge returns challenge based on random pin code generation
func PinChallenge(length uint) Challenge {
	return &pin{
		length: length,
	}
}

// Fingerprint implements trust.Node interface
func (ch pin) Fingerprint() []byte {
	return []byte("PinChallenge")
}

func (ch *pin) Ask(channel Channel) error {
	// https://stackoverflow.com/questions/22892120/how-to-generate-a-random-string-of-a-fixed-length-in-go

	// Phase 1. Generate question
	// pin := 1234

	// Phase 2. Send question to user
	return nil
	// return channel.Send(1234)
}

func (ch *pin) Check(node trust.Node, aswer interface{}) error {
	if pin, ok := aswer.(int); ok && pin == 1234 {
		return nil
	}

	return ErrWrongPin
}
