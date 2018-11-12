package step

import (
	"crypto/sha256"
	"fmt"
	"strings"
)

// Sum returns sha256 sum of provided parts joined by `-` (some kind of slug)
func Sum(parts ...string) string {
	return fmt.Sprintf(
		"%x",
		sha256.Sum256([]byte(
			strings.Join(parts, "-"),
		)),
	)
}
