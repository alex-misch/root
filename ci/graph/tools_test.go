package graph

import (
	"fmt"
	"reflect"
	"testing"
)

var rs = []string{
	"/foo",
	"/foo/bar",
	"/foo/bar/baz",
	"/lol/",
}

func TestClosest(t *testing.T) {
	tableTests := []struct {
		path    string
		roots   []string
		closest string
	}{
		{"/foo/bar/baz/lol/kek", rs, "/foo/bar/baz"},
		{"/foo/kek", rs, "/foo"},
		{"/lol/kek", rs, "/lol"},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if cl := closest(tt.path, tt.roots); cl != tt.closest {
				t.Fatalf("Expected %v, got %v", tt.closest, cl)
			}
		})
	}
}

func TestRoots(t *testing.T) {
	paths := []string{
		"/foo/1",
		"/foo/2",
		"/foo/bar/baz/3/4/5",
		"/foo/bar/baz/3/5",
		"/lol/kek/f",
		"/lol/kek/f2",
		"/lol/f3",
	}
	expected := []string{"/foo", "/foo/bar/baz", "/lol"}

	if out := roots(paths, rs); !reflect.DeepEqual(out, expected) {
		t.Fatalf("Expected %v, got %v", expected, out)
	}
}

func TestToRelPath(t *testing.T) {
	tableTests := []struct {
		root   string
		path   string
		result string
	}{
		{"./playground", "foo/bar", "playground/foo/bar"},
		{"./playground", "foo/bar/", "playground/foo/bar"},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if result := toRelPath(tt.root, tt.path); result != tt.result {
				t.Fatalf("Expected %v, got %v", tt.result, result)
			}
		})
	}
}
