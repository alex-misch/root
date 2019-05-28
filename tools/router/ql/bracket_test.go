package ql

import (
	"fmt"
	"testing"
)

func TestBracket(t *testing.T) {
	// DEBUG
	// DEBUG: for debugging this is first test entrypoint
	// DEBUG
	t.Run("String", func(t *testing.T) {
		tableTests := []struct {
			source string // source
			out    string // expected value of String() method
		}{
			// empty values - fallback
			{"", ""},
			{"param:", ""},
			{"?:", ""},
			// real values
			{"foo|bar|baz", "(?:foo|bar|baz)"},
			{"foo|bar|*", "(?:foo|bar|.*)"},
			{"fo.o|bar|*", "(?:fo\\.o|bar|.*)"},
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
				if out := string(bracket); out != tt.out {
					t.Fatalf("Expected %q, got %q", tt.out, out)
				}
			})
		}
	})
}
