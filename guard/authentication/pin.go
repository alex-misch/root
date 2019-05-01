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
	length int // length of the pin code
}

// PinChallenge returns challenge based on random pin code generation
func PinChallenge(length int) Challenge {
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

	// Phase 1. Generate pin
	// pin := 1234

	// Phase 2. Run hook for generated pin
	// if err := ch.save(pin); err != nil {
	// 	return nil
	// }

	// Phase 3. Send pin code to channel
	return nil
	// return channel.Send(1234)
}

func (ch *pin) Answer(node trust.Node, answer interface{}) (trust.Node, error) {
	if pin, ok := answer.(string); ok && pin == "1234" {
		return node, nil
	}

	return nil, ErrWrongPin
}
