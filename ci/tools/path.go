package tools

import (
	"path/filepath"
	"strings"
)

// AbsWorkdir is a special tool that returns full absolute path to context dir
// context is directory from config
// if special prefix '$' used then it is meaning `workdir` will be calculate from the repo(graph) root
// root is repo(graph) root
// pack is relative to root package location
func AbsWorkdir(root, pack, context string) string {
	if strings.HasPrefix(context, "$") {
		return filepath.Join("/", root, strings.TrimPrefix(context, "$"))
	} else {
		return filepath.Join("/", root, pack, context)
	}
}
