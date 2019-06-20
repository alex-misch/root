package router

import (
	"context"
	"fmt"
	"io"
	"reflect"
	"regexp"
	"testing"

	"github.com/boomfunc/root/tools/flow"
	"github.com/boomfunc/root/tools/router/ql"
)

func TestRoute(t *testing.T) {
	var i *int = new(int)

	route := Route{
		Pattern: regexp.MustCompile("^foobar$"),
		Step: flow.Func2(func(ctx context.Context, _ io.Reader, _, _ io.Writer) error {
			*i = 1
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

	t.Run("Params", func(t *testing.T) {
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
			{"/foo?{q:*}", "", nil},                             // no match
			{"/foo?{q:*}", "/foo", nil},                         // no match
			{"/foo?{q:*}", "/foo?", map[string]string{"q": ""}}, // empty
			{"/foo?{q:*}", "/foo?a=b&c=d", map[string]string{"q": "a=b&c=d"}},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				route := Route{Url: tt.uri, Pattern: ql.Regexp(tt.pattern)}
				if params := route.Params(); !reflect.DeepEqual(params, tt.params) {
					t.Fatalf("Expected '%v', got '%v'", tt.params, params)
				}
			})
		}
	})

	t.Run("Run", func(t *testing.T) {
		tableTests := []struct {
			route *Route
			err   error
			i     int
		}{
			{nil, ErrNotFound, 0},
			{&route, nil, 1},
		}

		for j, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", j), func(t *testing.T) {
				// Clear result
				*i = 0

				// Check error returned.
				// Run throw flow.Execute (ensures that `route` implements the interface).
				// if err := flow.Execute(tt.route); !reflect.DeepEqual(err, tt.err) {
				if err := tt.route.Run(nil, nil, nil, nil); !reflect.DeepEqual(err, tt.err) {
					t.Fatalf("Expected '%v', got '%v'", tt.err, err)
				}

				// Check result.
				if *i != tt.i {
					t.Fatalf("Expected '1', got: '%d'", i)
				}
			})
		}
	})
}
