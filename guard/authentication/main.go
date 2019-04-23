package authentication

import (
	"github.com/boomfunc/root/guard/trust"
)

// Challenge is the way to achieve Marker
type Challenge interface {
	Passed(marker Marker) error

	Ask(channel Channel) error
	Check(interface{}) (Marker, error)

	trust.Node
}

// Challenges describes your own authentication flow
// Tournament
type Challenges []Challenge

// Get returns nearest non passed challenge
// by provided markers chain
func (chs Challenges) Get(markers []Marker) Challenge {
	// Prephase. Checks
	if len(chs) == 0 {
		// empty flow, no challenges for user
		return nil
	}

	// index of current active challenge
	var i int

	// TODO: iterate over challenges
	// iterate over markers and chain of challenges
	for ; i < len(chs); i++ {
		// Phase 1. Check does i marker exists
		if len(markers) < i+1 {
			// i marker does not exists, current challenge undone
			break
		}

		// Phase 2. Check i marker valid (challenge passed)
		// try to encode by i challenge
		if err := chs[i].Passed(markers[i]); err != nil {
			// wrong marker, this challenge undone
			break
		}
	}

	// We calculated nearest undone challenge, return this
	return chs[i]
}

// Channel is the direct communication between Server and User
// transport layer used for providing Challenge .Ask() part
type Channel interface {
	Send() error
}

func do(flow Challenges, markers []Marker) error {
	// Phase 1. Try to get nearest undone challenge
	if challenge := flow.Get(markers); challenge != nil {
		// challenge accepted, ask user for answer
		return challenge.Ask(nil)
	}

	// user authenticated without any challenges
	return nil
}

func Do(markers []Marker) error {
	return do(flow, markers)
}
