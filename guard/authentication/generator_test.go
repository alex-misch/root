package authentication

import (
	"bytes"
	"fmt"
	"testing"

	"github.com/boomfunc/root/guard/trust"
)

func TestGenerator(t *testing.T) {
	t.Run("Fingerprint", func(t *testing.T) {
		tableTests := []struct {
			ch          trust.Node
			fingerprint string // check as string (for readability)
		}{
			{generator{length: 2, allowed: []byte{'0', '1'}}, "generator(length=2, allowed=[01])"},
			{generator{length: 3, allowed: []byte{'0', '1', 'a'}}, "generator(length=3, allowed=[01a])"},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if fingerprint := string(tt.ch.Fingerprint()); fingerprint != tt.fingerprint {
					t.Fatalf("Expected %v, got %q", tt.fingerprint, fingerprint)
				}
			})
		}
	})

	t.Run("generate", func(t *testing.T) {
		tableTests := []struct {
			ch  generator
			len int
		}{
			{generator{length: 2, allowed: []byte{'0', '1'}}, 2},
			{generator{length: 3, allowed: []byte{'0', '1', 'a'}}, 3},
			{generator{length: 6, allowed: []byte{'0', '1', '2', '3', '4', '5', '6', '7', '8', '9'}}, 6},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				code, _ := tt.ch.generate()
				if len := len(code); len != tt.len {
					t.Fatalf("Expected %v, got %q", tt.len, len)
				}
				for _, b := range code {
					if !bytes.Contains(tt.ch.allowed, []byte{b}) {
						t.Fatalf("Unexpected byte: %b", b)
					}
				}
			})
		}
	})
}
