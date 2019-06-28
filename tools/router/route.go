package router

import (
	"context"
	"io"
	"net/url"
	"regexp"

	"github.com/boomfunc/root/tools/flow"
	"github.com/boomfunc/root/tools/router/ql"
)

// Route is a single endpoint
// loads from config
// NOTE: implements `flow.Step` interface
type Route struct {
	Url     *url.URL
	Pattern *regexp.Regexp
	Step    flow.SStep
}

// NewRoute returns new instance of mux entry.
// From pattern the regexp will be generated.
func NewRoute(pattern string, step flow.SStep) *Route {
	return &Route{
		Pattern: ql.Regexp(pattern),
		Step:    step,
	}
}

// match return bool meaning this route is applicable to requested url.
// This method fully describes how url will be mapped to pattern.
func (r *Route) match(u *url.URL) bool {
	// We will simply try to match all url's string representation (including get params).
	return r.Pattern.MatchString(
		u.RequestURI(),
	)
}

// WithUrl returns new route with embedded url.
// Can be interpreted as the `RouteMatch` instance.
func (r *Route) WithUrl(u *url.URL) *Route {
	return &Route{
		Url:     u,
		Pattern: r.Pattern,
		Step:    r.Step,
	}
}

// Params return a map of keyword arguments fetched from `RouteMatch`.
func (r *Route) Params() map[string]string {
	// Case when we used MatchLax to match url from mux.
	if r == nil {
		return nil
	}

	// Case when this route instance is `abstract`.
	// Means this route not matched.
	if r.Url == nil {
		return nil
	}

	return MatchParams(r.Pattern, r.Url.RequestURI())
}

// Run runs associated Step interface. Also implements the `flow.Step` interface itself.
func (r *Route) Run(ctx context.Context, stdin io.Reader, stdout, stderr io.Writer) error {
	// Case when we used MatchLax to match url from mux.
	if r == nil {
		return ErrNotFound
	}

	return r.Step.Run(ctx, stdin, stdout, stderr)
	// return flow.ExecuteWithContext(ctx, r.Step)
}
