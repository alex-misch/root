package authentication

import (
	"fmt"
	"testing"
)

func TestPwdChallenge(t *testing.T) {
	t.Run("Check", func(t *testing.T) {
		tableTests := []struct {
			answer interface{}
			marker string
			err    error
		}{
			{nil, "", ErrWrongPassword},
			{8, "", ErrWrongPassword},
			{"wrong", "", ErrWrongPassword},
			{"foobar", "session", nil},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				marker, err := ch1.Check(tt.answer)
				if err != tt.err {
					t.Fatalf("Expected %q, got %q", tt.err, err)
				}
				if marker != tt.marker {
					t.Fatalf("Expected %q, got %q", tt.marker, marker)
				}
			})
		}
	})
}
