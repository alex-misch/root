package authentication

import (
	"github.com/boomfunc/root/guard/trust"
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

// mitem is is the internal type for sorted Marker collection
type mitem struct {
	marker Marker
	index  int
}

// Markers is the collection of marker
// implements sort.Interface for respect ordering
type Markers []mitem

// Len is part of sort.Interface.
func (ms Markers) Len() int {
	return len(ms)
}

// Swap is part of sort.Interface.
func (ms Markers) Swap(i, j int) {
	ms[i], ms[j] = ms[j], ms[i]
}

// Less is part of sort.Interface.
func (ms Markers) Less(i, j int) bool {
	return ms[i].index < ms[j].index
}
