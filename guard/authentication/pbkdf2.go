package authentication

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"github.com/boomfunc/root/guard/trust"
	"golang.org/x/crypto/pbkdf2"
)

// credentials provides ability to fetch `Abstract` node
type credentials struct {
	Login    []byte
	Password []byte
}

// Credentials create login - password pair from raw user input
func Credentials(payload []byte) (*credentials, error) {
	parts := bytes.SplitN(payload, []byte{':'}, 2)
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

// Payload transform credentials to trust.Artifact
func (cred *credentials) Payload() []byte {
	return bytes.Join([][]byte{cred.Login, cred.Password}, []byte{':'})
}

// pbkdf2ch is the challenge based on PBKDF2 password derivation
// use PBKDF2
type pbkdf2ch struct {
	iter      int
	length    int
	algorithm string
}

// PBKDF2Challenge returns challenge based on hashing password pair of answer
func PBKDF2Challenge(iter int, length int) Challenge {
	return &pbkdf2ch{
		iter:      iter,
		length:    length,
		algorithm: "SHA256",
	}
}

// Fingerprint implements trust.Node interface
func (ch pbkdf2ch) Fingerprint() []byte {
	return []byte(
		fmt.Sprintf("pbkdf2(iter=%d, length=%d, algorithm='%s')", ch.iter, ch.length, ch.algorithm),
	)
}

// key derivates password
func (ch pbkdf2ch) key(password []byte) []byte {
	// NOTE: as salt we use challenge's fingerprint
	src := pbkdf2.Key(password, ch.Fingerprint(), ch.iter, ch.length, sha256.New)
	dst := make([]byte, hex.EncodedLen(len(src)))
	hex.Encode(dst, src)
	return dst
}

// Ask do nothing
// common usage is the first challenge to fetch node by credentials
func (ch pbkdf2ch) Ask(save trust.ArtifactHook, node trust.Node) error { return nil }

// Answer checks user input for this type of challenge
// In fact, check does in storage exists row with provided username and password
func (ch pbkdf2ch) Answer(fetch trust.ArtifactHook, node trust.Node, answer []byte) (trust.Node, error) {
	// Phase 1. Check fetch hook
	if fetch == nil {
		return nil, ErrChallengeFailed
	}

	// Phase 2. Parse answer.
	// If node exists - we must use answer as raw data.
	// Otherwise - try to parse it throw credentials separated values.
	if node == nil {
		// use special tool
		credentials, err := Credentials(answer)
		if err != nil {
			return nil, err
		}
		// case when this challenge must set the new node
		node = credentials.Abstract()
		// also, answer to hash will be password part of the credentials
		answer = credentials.Password
	}

	// Phase 3. Hash answer to artifact and send to hook.
	// It is the main purpose of this type of challenge
	artifact := ch.key(answer)
	if err := fetch(artifact, ch, node); err != nil {
		return nil, err
	}

	return node, nil
}
