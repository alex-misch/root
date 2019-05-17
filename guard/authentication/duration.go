package authentication

import (
	"fmt"
	"time"

	"github.com/boomfunc/root/guard/trust"
)

// duration is challenge based on simple revalidation every interval of time
// as artifact we use current time
// in asnwer part we calculate interval for next revalidation
type duration struct {
	d time.Duration // nanoseconds
}

func DurationChallenge(d time.Duration) Challenge {
	return &duration{d}
}

// artifact generates duration artifact
// main idea: how many deltas of duration in current timestamp?
// func (ch duration) artifact() ([]byte, error) {

// time.Now().UnixNano() / ch.d.Nanoseconds()

// }

// Fingerprint implements trust.Node interface
func (ch duration) Fingerprint() []byte {
	return []byte(
		fmt.Sprintf("duration(d=%s)", ch.d),
	)
}

func (ch duration) Ask(save trust.ArtifactHook, node trust.Node) error {
	return nil
}

func (ch duration) Answer(fetch trust.ArtifactHook, node trust.Node, answer []byte) (trust.Node, error) {
	return node, nil
}
