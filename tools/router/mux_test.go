package router

import (
	"fmt"
	"net/url"
	"reflect"
	"regexp"
	"testing"
)

func TestMux(t *testing.T) {
	foo := &Route{Pattern: regexp.MustCompile("^foo"), Step: nil}
	foobar := &Route{Pattern: regexp.MustCompile("^foobar"), Step: nil}
	foobarbaz := &Route{Pattern: regexp.MustCompile("^foobarbaz"), Step: nil}

	router := Mux([]Route{*foo, *foobar, *foobarbaz})

	t.Run("Match", func(t *testing.T) {
		tableTests := []struct {
			url   string // incoming url
			route *Route // expected route
			err   error  // expected error
		}{
			{"foo", foo.WithUrl("foo"), nil},
			{"foobar", foo.WithUrl("foobar"), nil},
			{"foobarbaz", foo.WithUrl("foobarbaz"), nil},
			{"foobarbazlol", foo.WithUrl("foobarbazlol"), nil},
			{"lolkek", nil, ErrNotFound},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				parsed, err := url.Parse(tt.url)
				if err != nil {
					t.Fatalf("Unexpected error: %q", err)
				}

				t.Run("Lax", func(t *testing.T) {
					route := router.MatchLax(parsed)
					if !reflect.DeepEqual(route, tt.route) {
						t.Fatalf("Expected '%v', got '%v'", tt.route, route)
					}
				})

				t.Run("Match", func(t *testing.T) {
					route, err := router.MatchStrict(parsed)
					if err != tt.err {
						t.Fatalf("Expected %q, got %q", tt.err, err)
					}
					if !reflect.DeepEqual(route, tt.route) {
						t.Fatalf("Expected '%v', got '%v'", tt.route, route)
					}
				})
			})
		}
	})
}
