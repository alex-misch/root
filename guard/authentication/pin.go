package authentication

// PinChallenge is simple pin code verification
type PinChallenge struct{}

func (ch *PinChallenge) Access(marker string) error {
	// TODO: only if we have user marker
	return nil
}

func (ch *PinChallenge) Ask(channel Channel) error {
	// Phase 1. Generate question
	// pin := 1234

	// Phase 2. Send question to user
	return channel.Send()
}

func (ch *PinChallenge) Check() (error, string) {
	// Phase 1. Check password from db
	// login in challenge struct
	// password raw came from answer (TODO)
	// fetch from db

	// Phase 2. Session marker
	return nil, "session"
}
