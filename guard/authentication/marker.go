package authentication

import (
	"errors"

	"github.com/boomfunc/root/guard/trust"
)

var (
	ErrWrongMarker = errors.New("guard/authentication: Wrong `marker` provided")
)

// Marker is token
// means that the user finished some challenge
type Marker []byte

// NewMarker creates new token
// that is the representation of trust relation between
// somebody who tries to authenticate and the challenge he has done
func NewMarker(from, to trust.Node) (Marker, error) {
	return trust.Create(from, to)
}

func (m Marker) Decode(password []byte) ([]byte, error) {
	// trusted := trust.Check(m, nil, nil)
	return nil, nil
}
