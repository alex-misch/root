package authentication

import (
	"fmt"
	"reflect"
	"testing"

	"github.com/boomfunc/root/guard/trust"
)

func TestLoginPwdChallenge(t *testing.T) {
	user := node("root")
	ch := &LoginPwdChallenge{}

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
				marker, err := ch.Check(user, tt.answer)
				if err != tt.err {
					t.Fatalf("Expected %q, got %q", tt.err, err)
				} else if err == nil {
					node, err := trust.Open(marker, ch)
					if err != nil {
						t.Fatal(err)
					}
					if !reflect.DeepEqual(node.Fingerprint(), tt.node.Fingerprint()) {
						t.Fatalf("Expected %q, got %q", tt.node.Fingerprint(), node.Fingerprint())
					}
				}
			})
		}
	})
}
