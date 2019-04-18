package authentication

// PwdChallenge is simplest challenge based on login-password pair
type PwdChallenge struct {
	login string
}

func (ch *PwdChallenge) Allowed(marker string) error {
	// always accessible
	return nil
}

func (ch *PwdChallenge) Passed(marker string) error {
	if marker == "session" {
		return nil
	}

	return ErrWrongMarkers
}

func (ch *PwdChallenge) Ask(channel Channel) error {
	// Phase 1. Generate question
	// TODO??????

	// Phase 2. Send question to user
	// return channel.Send()
	return nil
}

func (ch *PwdChallenge) Check(aswer interface{}) (string, error) {
	// Phase 1. Check password from db
	// login in challenge struct
	// password raw came from answer (TODO)
	// fetch from db

	// Phase 2. Session marker
	return "session", nil
}
