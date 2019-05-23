package router

import (
	"context"
	"errors"
	"net/url"
	"regexp"
	"io"

	"github.com/boomfunc/root/tools/flow"
	"github.com/boomfunc/root/tools/router/ql"
)

var (
	ErrNotFound         = errors.New("tools/router: Route not found")
	ErrUriInappropriate = errors.New("tools/router: Inappropriate uri")
)

// Mux is collection of endpoints in priority order.
// Implements multiplexer logic.
type Mux []Route

func (routes Mux) MatchLax(url *url.URL) *Route {
	// try to get the route in priority order
	for _, route := range routes {
		if route.Match(url.RequestURI()) {
			return &route
		}
	}
	// nothing resolved
	return nil
}

// Match returns most priority route by pattern (look at ql subpackage)
func (routes Mux) Match(url *url.URL) (*Route, error) {
	// try to get the route in priority order
	for _, route := range routes {
		if route.Match(url.RequestURI()) {
			return &route, nil
		}
	}
	// nothing resolved
	return nil, ErrNotFound
}

// Route is a single endpoint
// loads from config
// NOTE: implements `flow.Step` interface
type Route struct {
	Pattern *regexp.Regexp
	Step    flow.SStep
}

// NewRoute returns new instance of mux entry
// from pattern the regexp will be generated
func NewRoute(pattern string, step flow.SStep) *Route {
	return &Route{
		Pattern: ql.Regexp(pattern),
		Step:    step,
	}
}

// Match return bool meaning this route is applicable to requested uri
func (r *Route) Match(uri string) bool {
	return r.Pattern.MatchString(uri)
}

// Match trying to match incoming string on pattern and return map of captured data and
// bool meaning this string was matched
func (r *Route) MatchParams(uri string) (map[string]string, error) {
	return MatchParams(r.Pattern, uri)
}

// Run runs associted Step interface
// implements implements `flow.Step` interface itself
func (r *Route) Run(ctx context.Context, stdin io.Reader, stdout, stderr io.Writer) error {
	return r.Step.Run(ctx, stdin, stdout, stderr)
	// return flow.ExecuteWithContext(ctx, r.Step)
}
