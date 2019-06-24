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
func (routes Mux) MatchLax(u *url.URL) *Route {
	// Describe url as a string.
	surl := u.RequestURI()

	// Try to get the route in priority order.
	for _, route := range routes {
		if route.MatchString(surl) {
			return route.WithUrl(u)
		}
	}

	// Nothing resolved.
	return nil
}

// MatchStrict returns most priority route by pattern (look at ql subpackage).
// If url is not mapped - error returned.
func (routes Mux) MatchStrict(u *url.URL) (*Route, error) {
	if route := routes.MatchLax(u); route != nil {
		return route, nil
	}

	return nil, ErrNotFound
}
