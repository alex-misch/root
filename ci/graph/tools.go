package graph

import (
	"path/filepath"
	"strings"
)

// closest finds nearest root for specified path
func closest(path string, roots []string) string {
	var candidate string

	for _, root := range roots {
		if strings.HasPrefix(path, root) {
			if len(root) > len(candidate) {
				candidate = root
			}
		}
	}

	return filepath.Clean(candidate)
}

// roots is helper for resolving list of paths into list or roots
// m2m
func roots(paths, roots []string) []string {
	var output []string
	m := make(map[string]struct{})

	for _, path := range paths {
		if root := closest(path, roots); root != "" {
			if _, ok := m[root]; !ok {
				m[root] = struct{}{}
				output = append(output, root)
			}
		}
	}

	return output
}

// toRelPath is helper that converts path to be relative to graph root
func toRelPath(root, path string) string {
	return strings.TrimLeft(filepath.Join(root, path), "/")
}
