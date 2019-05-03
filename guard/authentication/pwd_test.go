package authentication

import (
	"fmt"
	"reflect"
	"testing"

	"github.com/boomfunc/root/guard/trust"
)

func TestLoginPwdChallenge(t *testing.T) {
	var user trust.Node = node("root")
	var ch Challenge = &LoginPwdChallenge{}

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
			{user, []byte("rootpwd"), nil},
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
