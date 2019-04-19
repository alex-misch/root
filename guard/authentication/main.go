package authentication

import (
	"errors"
)

var (
	ErrWrongMarkers = errors.New("guard/authentication: Wrong `markers` provided")
)

// Marker is token means that the user finished some challenge
// achievement
type Marker string

// Markers is access control tokens
// Used for access to User or Challenge
type Markers []string

// Challenge is the way to achieve Marker
type Challenge interface {
	Allowed(marker string) error
	Passed(marker string) error

	Ask(channel Channel) error
	Check(interface{}) (string, error)
}

// Challenges describes yout own authentication flow
// Tournament
type Challenges []Challenge

// Get returns nearest non passed challenge
func (chs Challenges) Get(markers Markers) Challenge {
	// Prephase. Checks
	if len(chs) == 0 {
		// empty flow, no challenges for user
		return nil
	}

	// index of current active challenge
	var i int

	// iterate over markers and chain of challenges
	for ; i < len(markers); i++ {
		marker := markers[i]

		// Phase 1. Check i marker valid (challenge passed)
		// try to encode by i challenge
		if err := chs[i].Passed(marker); err != nil {
			// wrong marker, this challenge undone
			break
		}

		// Is chellange set continues?
		if len(chs) <= i+1 {
			// all markers valid and chain complete, nothing to do
			// the user is who he is
			return nil
		}

		// Phase 2. Challenge passed, does user allowed to challenge next
		// Check tah current marker have access to next challenge
		// in other words, the chain of the challenges is correct
		if err := chs[i+1].Allowed(marker); err != nil {
			// Chain broken, no acess to next challenge
			// this challenge must be re-played
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

func do(flow Challenges, markers Markers) error {
	// Phase 1. Try to get nearest undone challenge
	if challenge := flow.Get(markers); challenge != nil {
		// challenge accepted, ask user for answer
		return challenge.Ask(nil)
	}

	// user authenticated without any challenges
	return nil
}

func Do(markers Markers) error {
	return do(flow, markers)
}
