package authentication

import (
	"encoding/hex"
	"fmt"
	"reflect"
	"testing"

	"github.com/boomfunc/root/guard/trust"
)

func TestPBKDF2Challenge(t *testing.T) {
	t.Run("Fingerprint", func(t *testing.T) {
		tableTests := []struct {
			ch          trust.Node
			fingerprint string // check as string (for readability)
		}{
			{pbkdf2ch{length: 2, iter: 4096, algorithm: "foo"}, "pbkdf2(iter=4096, length=2, algorithm='foo')"},
			{pbkdf2ch{length: 3, iter: 100000, algorithm: "bar"}, "pbkdf2(iter=100000, length=3, algorithm='bar')"},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if fingerprint := string(tt.ch.Fingerprint()); fingerprint != tt.fingerprint {
					t.Fatalf("Expected %v, got %q", tt.fingerprint, fingerprint)
				}
			})
		}
	})

	t.Run("key", func(t *testing.T) {
		tableTests := []struct {
			ch  pbkdf2ch
			len int // NOTE: real len will be n * 2 because it was hex encoded
		}{
			{pbkdf2ch{length: 2, iter: 4096}, 2},
			{pbkdf2ch{length: 3, iter: 100000}, 3},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				key := tt.ch.key([]byte{'r', 'o', 'o', 't'})
				if len := len(key); len != hex.EncodedLen(tt.len) {
					t.Fatalf("Expected %v, got %q", tt.len, len)
				}
			})
		}
	})

	var user trust.Node = node("root")
	var ch Challenge = PBKDF2Challenge(4096, 32)

	t.Run("Answer", func(t *testing.T) {
		tableTests := []struct {
			node   trust.Node
			answer []byte
			err    error
		}{
			{nil, nil, ErrChallengeFailed},
			{nil, []byte("8"), ErrChallengeFailed},
			{nil, []byte("wrong"), ErrChallengeFailed},
			{user, []byte("wrong"), ErrChallengeFailed},
			// {user, []byte("rootpwd"), nil},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				_, err := ch.Answer(nil, user, tt.answer)
				if !reflect.DeepEqual(err, tt.err) {
					t.Fatalf("Expected %q, got %q", tt.err, err)
				}
			})
		}
	})
}
