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
	foou, _ := url.Parse("foo")

	foobar := &Route{Pattern: regexp.MustCompile("^foobar"), Step: nil}
	foobaru, _ := url.Parse("foobar")

	foobarbaz := &Route{Pattern: regexp.MustCompile("^foobarbaz"), Step: nil}
	foobarbazu, _ := url.Parse("foobarbaz")
	foobarbazlolu, _ := url.Parse("foobarbazlol")

	router := Mux([]Route{*foo, *foobar, *foobarbaz})

	t.Run("Match", func(t *testing.T) {
		tableTests := []struct {
			url   string // incoming raw url
			route *Route // expected route
			err   error  // expected error
		}{
			{"foo", foo.WithUrl(foou), nil},
			{"foobar", foo.WithUrl(foobaru), nil},
			{"foobarbaz", foo.WithUrl(foobarbazu), nil},
			{"foobarbazlol", foo.WithUrl(foobarbazlolu), nil},
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
