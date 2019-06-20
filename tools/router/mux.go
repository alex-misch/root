package router

import (
	"errors"
	"net/url"
)

var (
	ErrNotFound = errors.New("tools/router: Route not found")
)

// Mux is collection of endpoints in priority order.
// Implements multiplexer logic.
type Mux []Route

// MatchLax returns most priority route by pattern (look at ql subpackage).
// If url is not mapped - nil returned.
// Error `ErrNotFound` will be thrown in .Run() method.
// This method used in chains like.
// err := mux.MatchLax(url).Run(ctx)
func (routes Mux) MatchLax(url *url.URL) *Route {
	// Describe url as a string.
	surl := url.RequestURI()

	// Try to get the route in priority order.
	for _, route := range routes {
		if route.Match(surl) {
			return route.WithUrl(surl)
		}
	}
	// Nothing resolved.
	return nil
}

// MatchStrict returns most priority route by pattern (look at ql subpackage).
// If url is not mapped - error returned.
func (routes Mux) MatchStrict(url *url.URL) (*Route, error) {
	route := routes.MatchLax(url)
	if route == nil {
		return nil, ErrNotFound
	}
	return route, nil
}
