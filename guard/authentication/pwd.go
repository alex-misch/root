package authentication

import (
	"bytes"

	"github.com/boomfunc/root/guard/trust"
)

// credentials provides ability to fetch `Abstract` node
type credentials struct {
	Login    []byte
	Password []byte
}

// Credentials create login - password pair from raw user input
func Credentials(answer []byte) (*credentials, error) {
	parts := bytes.SplitN(answer, []byte{':'}, 2)
	if len(parts) != 2 {
		return nil, ErrChallengeFailed
	}

	cred := &credentials{
		Login:    parts[0],
		Password: parts[1],
	}

	return cred, nil
}

// Abstract returns fingerprint based on login
func (cred *credentials) Abstract() trust.Node {
	return trust.Abstract(cred.Login)
}

// LoginPwdChallenge is simplest challenge based on login-password pair
type LoginPwdChallenge struct {
	// something like algoritms
	// common challenge data
}

// Fingerprint implements trust.Node interface
func (ch LoginPwdChallenge) Fingerprint() []byte {
	return []byte("LoginPwdChallenge")
}

// Ask do nothing
// common usage is the first challenge to fetch node by credentials
func (ch LoginPwdChallenge) Ask(save trust.ArtifactHook, node trust.Node) error { return nil }

// Answer checks user input for this type of challenge
// In fact, check does in storage exists row with provided username and password
func (ch LoginPwdChallenge) Answer(fetch trust.ArtifactHook, node trust.Node, answer []byte) (trust.Node, error) {
	// Phase 1. Run hook for generated random bytes (fetch part)
	if fetch == nil {
		return nil, ErrChallengeFailed
	}

	credentials, err := Credentials(answer)
	if err != nil {
		return nil, err
	}

	if node == nil {
		// case when this challenge must set the node
		node = credentials.Abstract()
	}

	if err := fetch(credentials.Password, ch, node); err != nil {
		return nil, err
	}

	return node, nil
}
