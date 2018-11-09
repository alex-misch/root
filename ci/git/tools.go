package git

import (
	"crypto/sha256"
	"fmt"
	"path/filepath"
)

func ClonePath(origin string) string {
	return filepath.Join(
		"/bmpci",
		"repos",
		fmt.Sprintf("%x", sha256.Sum256([]byte(origin))),
	)
}
