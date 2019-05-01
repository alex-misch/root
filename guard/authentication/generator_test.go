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
			gen         trust.Node
			fingerprint string // check as string (for readability)
		}{
			{generator{2, []byte{'0', '1'}}, "Generator(length=2, allowed=[01])"},
			{generator{3, []byte{'0', '1', 'a'}}, "Generator(length=3, allowed=[01a])"},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if fingerprint := string(tt.gen.Fingerprint()); fingerprint != tt.fingerprint {
					t.Fatalf("Expected %v, got %q", tt.fingerprint, fingerprint)
				}
			})
		}
	})

	t.Run("generate", func(t *testing.T) {
		tableTests := []struct {
			gen generator
			len int
		}{
			{generator{2, []byte{'0', '1'}}, 2},
			{generator{3, []byte{'0', '1', 'a'}}, 3},
			{generator{6, []byte{'0', '1', '2', '3', '4', '5', '6', '7', '8', '9'}}, 6},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				code, _ := tt.gen.generate()
				if len := len(code); len != tt.len {
					t.Fatalf("Expected %v, got %q", tt.len, len)
				}
				for _, b := range code {
					if !bytes.Contains(tt.gen.allowed, []byte{b}) {
						t.Fatalf("Unexpected byte: %b", b)
					}
				}
			})
		}
	})
}
