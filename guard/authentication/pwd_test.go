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

	t.Run("Check", func(t *testing.T) {
		tableTests := []struct {
			node   trust.Node
			answer interface{}
			err    error
		}{
			{nil, nil, ErrWrongPassword},
			{nil, 8, ErrWrongPassword},
			{nil, "wrong", ErrWrongPassword},
			{user, "wrong", ErrWrongPassword},
			{user, "rootpwd", nil},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				err := ch.Check(user, tt.answer)
				if !reflect.DeepEqual(err, tt.err) {
					t.Fatalf("Expected %q, got %q", tt.err, err)
				}
			})
		}
	})
}
