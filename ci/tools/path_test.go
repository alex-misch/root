package tools

import (
	"fmt"
	"testing"
)

func TestAbsWorkdir(t *testing.T) {
	tableTests := []struct {
		root    string
		pack    string
		context string
		workdir string
	}{
		// relative to package
		{"/bmpci/repo", "foo/bar", "src", "/bmpci/repo/foo/bar/src"},   // usual
		{"./bmpci/repo", "foo/bar", "src/", "/bmpci/repo/foo/bar/src"}, // non abs root
		{"bmpci/repo/", "./foo/././bar/", "./src/", "/bmpci/repo/foo/bar/src"},
		// from root
		{"bmpci/repo/", "./foo/bar/", "$/./src/", "/bmpci/repo/src"},
		{"bmpci/repo/", "./foo/bar/", "$src/", "/bmpci/repo/src"},
		{"bmpci/repo/", "./foo/./bar/", "$/src/", "/bmpci/repo/src"},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if workdir := AbsWorkdir(tt.root, tt.pack, tt.context); workdir != tt.workdir {
				t.Errorf("Expected %q, got %q", tt.workdir, workdir)
			}
		})
	}
}
