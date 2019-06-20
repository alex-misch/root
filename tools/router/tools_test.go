package router

import (
	"fmt"
	"reflect"
	"regexp"
	"testing"
)

func TestMatchParams(t *testing.T) {
	tableTests := []struct {
		pattern string            // incoming pattern for regexp
		uri     string            // incoming string to match
		params  map[string]string // expecting params
	}{
		{"^foobar$", "lolkek", nil},     // no match
		{"^foobar$", "foobar", nil},     // match and no group
		{"^(foo)(bar)$", "foobar", nil}, // not named groups
		{"^(?P<foo>foo)(b)(?P<ar>ar)$", "foobar", map[string]string{"foo": "foo", "ar": "ar"}},              // mixed
		{"^(?P<foo>foo)(?P<bar>bar)$", "foobar", map[string]string{"foo": "foo", "bar": "bar"}},             // all named
		{"^foo(?P<bar>bar)?(?P<baz>baz)$", "foobaz", map[string]string{"bar": "", "baz": "baz"}},            // special case - optional group in the middle
		{"^foo(?P<bar>.*)?(?P<baz>baz)$", "foobaz", map[string]string{"bar": "", "baz": "baz"}},             // special case - optional group in the middle
		{"^foo(?P<bar>.*)?(?P<baz>baz)$", "foololkekbaz", map[string]string{"bar": "lolkek", "baz": "baz"}}, // special case - optional group in the middle
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			re, err := regexp.Compile(tt.pattern)
			if err != nil {
				t.Fatalf("Unexpected error, got %q", err.Error())
			}

			if params := MatchParams(re, tt.uri); !reflect.DeepEqual(params, tt.params) {
				t.Fatalf("Expected %q, got %q", tt.params, params)
			}
		})
	}
}
