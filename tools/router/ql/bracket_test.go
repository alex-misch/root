package ql

import (
	"fmt"
	"testing"
)

func TestBracket(t *testing.T) {
	t.Run("String", func(t *testing.T) {
		tableTests := []struct {
			source string // source
			out    string // expected value of String() method
		}{
			{"", "(?:)"},
			{"foo|bar|baz", "(?:foo|bar|baz)"},
			{"foo|bar|*", "(?:foo|bar|.*)"},
		}

		for i, tt := range tableTests {
			bracket := NewBracket(tt.source)

			t.Run(fmt.Sprintf("%d.String()", i), func(t *testing.T) {
				if bracket.String() != tt.out {
					t.Fatalf("Expected %q, got %q", tt.out, bracket.String())
				}
			})

			t.Run(fmt.Sprintf("fmt.Sprint(%d)", i), func(t *testing.T) {
				if fmt.Sprint(bracket) != tt.out {
					t.Fatalf("Expected %q, got %q", tt.out, fmt.Sprint(bracket))
				}
			})
		}
	})

	t.Run("New", func(t *testing.T) {
		tableTests := []struct {
			source string // source
			out    string // expected value of String() method
		}{
			{"", ""},
			{"{}", ""},
			{"{", ""},
			{"}", ""},
			{"{foo|bar|baz}", "foo|bar|baz"},
			{"{foo|bar|baz", "foo|bar|baz"},
		}

		for i, tt := range tableTests {
			bracket := NewBracket(tt.source)

			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if bracket.source != tt.out {
					t.Fatalf("Expected %q, got %q", tt.out, bracket.source)
				}
			})
		}
	})
}
