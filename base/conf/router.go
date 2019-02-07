package conf

import (
	"context"
	"errors"
	"io"
	"net/url"
	"regexp"

	"github.com/boomfunc/root/base/pipeline"
	"github.com/boomfunc/root/tools/router"
	"github.com/boomfunc/root/tools/router/ql"
)

var (
	ErrRouteNotFound = errors.New("base/conf: Route not found")
)

// TODO look at Pipeline.UnmarshalYAML and remake this to type []Route
type Router struct {
	Collection []Route
}

func (rc *Router) Match(url *url.URL) (*Route, error) {
	for _, route := range rc.Collection {
		if route.match(url.RequestURI()) {
			return &route, nil
		}
	}

	return nil, ErrRouteNotFound
}

type Route struct {
	regexp   *regexp.Regexp
	pipeline pipeline.Pipeline
}

func (r *Route) match(uri string) bool {
	return r.regexp.MatchString(uri)
}

// Match trying to match incoming string on pattern and return map of captured data and
// bool meaning this string was matched
func (r *Route) MatchParams(uri string) (map[string]string, error) {
	return router.MatchParams(r.regexp, uri)
}

func (r *Route) Run(ctx context.Context, input io.Reader, output io.Writer) error {
	ctx = context.WithValue(ctx, "input", input)
	ctx = context.WithValue(ctx, "output", output)

	return r.pipeline.Run(ctx)
}

func (r *Route) UnmarshalYAML(unmarshal func(interface{}) error) error {
	// inner struct for accepting strings
	var route struct {
		Pattern  string
		Pipeline pipeline.Pipeline
	}

	if err := unmarshal(&route); err != nil {
		return err
	}

	// yaml valid, transform it
	r.regexp = ql.Regexp(route.Pattern)
	r.pipeline = route.Pipeline

	return nil
}
