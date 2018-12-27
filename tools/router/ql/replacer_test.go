package ql

import (
	"fmt"
	"testing"
)

func TestReplacer(t *testing.T) {
	t.Run("default", func(t *testing.T) {
		tableTests := []struct {
			source string // source
			out    string // expected value of replacer output
		}{
			{"", "(?:)"},
			{"foo|bar|baz", "(?:foo|bar|baz)"},
			{"foo|bar|*", "(?:foo|bar|.*)"},
		}

		var replacer Replacer = defaultReplacer

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if out := replacer(tt.source); out != tt.out {
					t.Fatalf("Expected %q, got %q", tt.out, out)
				}
			})
		}
	})

	t.Run("group", func(t *testing.T) {
		tableTests := []struct {
			source string // source
			out    string // expected value of replacer output
		}{
			{"", "(?<lolkek>)"},
			{" ", "(?<lolkek> )"},
			{"foo|bar|baz", "(?<lolkek>foo|bar|baz)"},
			{"foo|bar|*", "(?<lolkek>foo|bar|.*)"},
		}

		var replacer Replacer = groupReplacer("lolkek")

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if out := replacer(tt.source); out != tt.out {
					t.Fatalf("Expected %q, got %q", tt.out, out)
				}
			})
		}
	})

	t.Run("query", func(t *testing.T) {
		tableTests := []struct {
			source string // source
			out    string // expected value of replacer output
		}{
			{"", "TODO"},  // fallback value
			{" ", "TODO"}, // fallback value
			// unvalued
			{"foobar", "^(?=.*(?:^|&)foobar(?:=(?P<foobar>[^&#]*))?).*$"},
			{" foobar  ", "^(?=.*(?:^|&)foobar(?:=(?P<foobar>[^&#]*))?).*$"}, // key is always trimmed
			// valued
			{"foobar=lolkek", "^(?=.*(?:^|&)foobar=(?P<foobar>lolkek)(?:$|&)).*$"},
			{" foobar  =lolkek", "^(?=.*(?:^|&)foobar=(?P<foobar>lolkek)(?:$|&)).*$"}, // key is always trimmed
			// mixed
			{"a&b=& c =foobar& d  =foobar==", "^(?=.*(?:^|&)a(?:=(?P<a>[^&#]*))?)(?=.*(?:^|&)b(?:=(?P<b>[^&#]*))?)(?=.*(?:^|&)c=(?P<c>foobar)(?:$|&))(?=.*(?:^|&)d=(?P<d>foobar==)(?:$|&)).*$"}, // a, b - anything, c, d - by value
		}

		var replacer Replacer = queryReplacer

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if out := replacer(tt.source); out != tt.out {
					t.Fatalf("Expected %q, got %q", tt.out, out)
				}
			})
		}
	})
}
