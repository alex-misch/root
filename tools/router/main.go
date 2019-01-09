package router

import (
	"context"
	"errors"
	"net/url"
	"regexp"

	"github.com/boomfunc/root/tools/flow"
)

var (
	ErrNotFound         = errors.New("tools/router: Route not found")
	ErrUriInappropriate = errors.New("tools/router: Inappropriate uri")
)

// Router is collection of endpoints in priority order
type Router []Route

// func New(uris steps ...string) Router {
// 	// TODO TODO TODO
// }

// Match returns most priority route by pattern (look at ql subpackage)
func (routes Router) Match(url *url.URL) (*Route, error) {
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
	Step    flow.Step
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
func (route *Route) Run(ctx context.Context) error {
	return flow.ExecuteWithContext(ctx, route.Step)
}
