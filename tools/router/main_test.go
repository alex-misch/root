package router

import (
	"context"
	"fmt"
	"net/url"
	"reflect"
	"regexp"
	"testing"
	"io"

	"github.com/boomfunc/root/tools/flow"
	"github.com/boomfunc/root/tools/router/ql"
)

func TestRoute(t *testing.T) {
	var i int

	route := Route{
		Pattern: regexp.MustCompile("^foobar$"),
		Step: flow.Func2(func(ctx context.Context, _ io.Reader, _, _ io.Writer) error {
			i = 1
			return nil
		}),
	}

	// NOTE: just proxy test (see `regexp` package tests)
	// test case created for future custom logic (look at TODO in Route.Match)
	t.Run("Match", func(t *testing.T) {
		tableTests := []struct {
			uri string // incoming uri
			out bool   // expected value of String() method
		}{
			{"foobar", true},
			{"foobar2", false},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if out := route.Match(tt.uri); out != tt.out {
					t.Fatalf("Expected '%t', got '%t'", tt.out, out)
				}
			})
		}
	})

	t.Run("MatchParams", func(t *testing.T) {
		tableTests := []struct {
			pattern string // pattern from config
			uri     string // incoming uri
			params  map[string]string
		}{
			{"/{url:*}", "/", map[string]string{"url": ""}},
			{"{url:*}", "/", map[string]string{"url": "/"}},
			{"/{url:*}", "/foobar/", map[string]string{"url": "foobar/"}},
			{"{url:*}", "/foobar/", map[string]string{"url": "/foobar/"}},
			{"/foo/{url:*}", "/foo/bar", map[string]string{"url": "bar"}},
			{"foo/{url:*}", "foo/bar", map[string]string{"url": "bar"}},
			// regular cases
			{"/foo?{q:*}", "/foo", nil},                         // no match
			{"/foo?{q:*}", "/foo?", map[string]string{"q": ""}}, // empty
			{"/foo?{q:*}", "/foo?a=b&c=d", map[string]string{"q": "a=b&c=d"}},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				route := Route{Pattern: ql.Regexp(tt.pattern)}
				if params, _ := route.MatchParams(tt.uri); !reflect.DeepEqual(params, tt.params) {
					t.Fatalf("Expected '%v', got '%v'", tt.params, params)
				}
			})
		}
	})

	t.Run("Run", func(t *testing.T) {
		tableTests := []struct {
			route *Route
			err error
		}{
			{nil, nil}, // TODO
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				// check error returned
				// run throw flow.Execute (ensures that `route` implements the interface)
				// if err := flow.Execute(tt.route); !reflect.DeepEqual(err, tt.err) {
				if err := tt.route.Run(nil, nil, nil, nil); !reflect.DeepEqual(err, tt.err) {
					t.Fatalf("Expected '%v', got '%v'", tt.err, err)
				}
				// check result
				if i != 1 {
					t.Fatalf("Expected '1', got: '%d'", i)
				}
			})
		}
	})
}

func TestMux(t *testing.T) {
	foo := Route{regexp.MustCompile("^foo"), nil}
	foobar := Route{regexp.MustCompile("^foobar"), nil}
	foobarbaz := Route{regexp.MustCompile("^foobarbaz"), nil}

	router := Mux([]Route{foo, foobar, foobarbaz})

	t.Run("Match", func(t *testing.T) {
		tableTests := []struct {
			uri   string // incoming uri
			route *Route // expected value of String() method
			err   error  // expected error
		}{
			{"foo", &foo, nil},
			{"foobar", &foo, nil},
			{"foobarbaz", &foo, nil},
			{"foobarbazlol", &foo, nil},
			{"lolkek", nil, ErrNotFound},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				parsed, err := url.Parse(tt.uri)
				if err != nil {
					t.Fatalf("Unexpected error: %q", err)
				}

				route, err := router.Match(parsed)

				if err != tt.err {
					t.Fatalf("Expected %q, got %q", tt.err, err)
				}

				if !reflect.DeepEqual(route, tt.route) {
					t.Fatalf("Expected '%v', got '%v'", tt.route, route)
				}
			})
		}
	})
}
