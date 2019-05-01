package authentication

// set of tools for random generating payload
// used for second authentication factor such as pin code, one time password

import (
	"bytes"
	"crypto/rand"
	"fmt"
	"io"

	"github.com/boomfunc/root/guard/authentication/channel"
	"github.com/boomfunc/root/guard/trust"
)

// pin is simple pin code verification
type generator struct {
	length  int    // length of the pin code
	allowed []byte // chars allowed to be in generated bytes
}

// Fingerprint implements trust.Node interface
func (gen generator) Fingerprint() []byte {
	return []byte(
		fmt.Sprintf("Generator(length=%d, allowed=[%s])", gen.length, gen.allowed),
	)
}

// generate generates bytes according on generator rules (len and table of allowed chars)
func (gen generator) generate() ([]byte, error) {
	b := make([]byte, gen.length)

	if _, err := io.ReadAtLeast(rand.Reader, b, gen.length); err != nil {
		return nil, err
	}
	for i := 0; i < len(b); i++ {
		b[i] = gen.allowed[int(b[i])%len(gen.allowed)]
	}

	return b, nil
}

func (gen generator) Ask(c channel.Interface) error {
	// https://stackoverflow.com/questions/22892120/how-to-generate-a-random-string-of-a-fixed-length-in-go

	// Phase 1. Generate pin
	pin, err := gen.generate()
	if err != nil {
		return err
	}

	// Phase 2. Run hook for generated pin
	// if err := ch.save(pin); err != nil {
	// 	return nil
	// }

	// Phase 3. Send pin code to channel
	return c.Send(pin)
}

func (gen generator) Answer(node trust.Node, answer []byte) (trust.Node, error) {

	if bytes.Equal(answer, []byte("1234")) {
		return node, nil
	}

	return nil, ErrChallengeFailed
}
