package kvs

import (
	"fmt"
	"testing"
)

func TestDBPublic(t *testing.T) {
	t.Run("New", func(t *testing.T) {
		tableTests := []struct {
			in  []string
			out []string
		}{
			{nil, []string{"default"}},
			{[]string{}, []string{"default"}},
			{[]string{"foo"}, []string{"foo"}},
			{[]string{"foo", "bar"}, []string{"foo", "bar"}},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				db := New(tt.in...)

				if len(db) != len(tt.out) {
					t.Fatalf("len(db): Expected %q, got %q", len(tt.out), len(db))
				}

				// check aech namespace in base
				for _, key := range tt.out {
					ns, ok := db[key]
					if !ok {
						t.Errorf("db[%s]: Expected, but not exists", key)
					}

					if ns == nil {
						t.Errorf("db[%s]: Expected *Namespace, got <nil>", key)
					}
				}
			})
		}
	})
}
