package router

import (
	"context"
	"io"
	"regexp"

	"github.com/boomfunc/root/tools/flow"
	"github.com/boomfunc/root/tools/router/ql"
)

// Route is a single endpoint
// loads from config
// NOTE: implements `flow.Step` interface
type Route struct {
	Url     string
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

// Match return bool meaning this route is applicable to requested url.
func (r *Route) Match(url string) bool {
	return r.Pattern.MatchString(url)
}

// WithUrl returns new route with embedded url.
// Can be interpreted as the `RouteMatch` instance.
func (r *Route) WithUrl(url string) *Route {
	return &Route{
		Url:     url,
		Pattern: r.Pattern,
		Step:    r.Step,
	}
}

// Match trying to match incoming string on pattern and return map of captured data and
// bool meaning this string was matched
func (r *Route) Params() map[string]string {
	// Case when we used MatchLax to match url from mux.
	if r == nil {
		return nil
	}

	// Case when this route instance is `abstract`.
	// Means this route not matched.
	if r.Url == "" {
		return nil
	}

	return MatchParams(r.Pattern, r.Url)
}

// Run runs associted Step interface
// implements implements `flow.Step` interface itself
func (r *Route) Run(ctx context.Context, stdin io.Reader, stdout, stderr io.Writer) error {
	// Case when we used MatchLax to match url from mux.
	if r == nil {
		return ErrNotFound
	}

	return r.Step.Run(ctx, stdin, stdout, stderr)
	// return flow.ExecuteWithContext(ctx, r.Step)
}
