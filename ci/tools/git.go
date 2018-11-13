package tools

import (
	"path/filepath"
)

func SrcPath(origin string) string {
	return filepath.Join(
		"/bmpci",
		"src",
		Sum(origin),
	)
}
