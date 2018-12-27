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
		err     error             // expecting error
	}{
		{"^foobar$", "lolkek", nil, ErrUriInappropriate},                                                         // no match
		{"^foobar$", "foobar", nil, nil},                                                                         // match and no group
		{"^(foo)(bar)$", "foobar", nil, nil},                                                                     // not named groups
		{"^(?P<foo>foo)(b)(?P<ar>ar)$", "foobar", map[string]string{"foo": "foo", "ar": "ar"}, nil},              // mixed
		{"^(?P<foo>foo)(?P<bar>bar)$", "foobar", map[string]string{"foo": "foo", "bar": "bar"}, nil},             // all named
		{"^foo(?P<bar>bar)?(?P<baz>baz)$", "foobaz", map[string]string{"bar": "", "baz": "baz"}, nil},            // special case - optional group in the middle
		{"^foo(?P<bar>.*)?(?P<baz>baz)$", "foobaz", map[string]string{"bar": "", "baz": "baz"}, nil},             // special case - optional group in the middle
		{"^foo(?P<bar>.*)?(?P<baz>baz)$", "foololkekbaz", map[string]string{"bar": "lolkek", "baz": "baz"}, nil}, // special case - optional group in the middle
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			re, err := regexp.Compile(tt.pattern)
			if err != nil {
				t.Fatalf("Unexpected error, got %q", err.Error())
			}

			params, err := MatchParams(re, tt.uri)
			if err != tt.err {
				t.Fatalf("Expected %q, got %q", tt.err, err)
			}

			if !reflect.DeepEqual(params, tt.params) {
				t.Fatalf("Expected %q, got %q", tt.params, params)
			}
		})
	}
}
