package router

import (
	"context"
	"errors"
	"net/url"
	"regexp"

	"github.com/boomfunc/root/tools/flow"
)

var (
	ErrNotFound = errors.New("tools/router: Route not found")
)

// Router is collection of endpoints in priority order
type Router []Route

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
	pattern *regexp.Regexp
	step    flow.Step
}

// match return bool meaning this route is applicable to requested url
func (r *Route) Match(uri string) bool {
	// TODO here extend context for URl values
	return r.pattern.MatchString(uri)
}

// Run runs associted Step interface
// implements implements `flow.Step` interface itself
func (route *Route) Run(ctx context.Context) error {
	return flow.ExecuteWithContext(ctx, route.step)
}
