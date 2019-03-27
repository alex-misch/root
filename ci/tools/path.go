package tools

import (
	"fmt"
	"path/filepath"
	"strings"
)

var (
	CIROOT = "/bmpci" // describes fs root for storing anything for ci works
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

// RepoPath calculates path where repository for session will be cloned
// Example:
// /bmpci/src/$(sha origin)
func RepoPath(session string) string {
	return filepath.Join(
		CIROOT,
		"sessions",
		session,
		"repo",
	)
}

// ArtifactPath calculates path where container artifacts will be stored
// Example:
// /bmpci/artifact/$(sessionUUID)/$(sha origin + pack)
func ArtifactPath(session, origin, pack string) string {
	return filepath.Join(
		CIROOT,
		"artifact",
		session,
		Sum(origin, pack),
		// env.name,
	)
}

// CachePath calculates path where container caches will be stored
// same as ArtifactPath, but not session dependent
// Example:
// /bmpci/cache/$(sha origin + pack)/test
func CachePath(origin, pack, name string) string {
	return filepath.Join(
		CIROOT,
		"cache",
		Sum(origin, pack),
		name,
	)
}

// LogPath calculates path where container logs will be stored
func LogPath(container string) string {
	return filepath.Join(
		CIROOT,
		"log",
		fmt.Sprintf("%s.log", container),
	)
}

// LogPath calculates path where container logs will be stored
func GraphMapPath(session string) string {
	return filepath.Join(
		CIROOT,
		"sessions",
		session,
		"map",
	)
}

// SessionLogPath calculates path where session common log will be stored
func SessionLogPath(session string) string {
	return filepath.Join(
		CIROOT,
		"sessions",
		session,
		"log",
	)
}
