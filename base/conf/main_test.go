package conf

import (
	"bytes"
	"context"
	"fmt"
	"net/url"
	"testing"

	"gopkg.in/yaml.v2"
)

// NOTE:
// configs for yaml source wrapped in backticks (for multiline string)
// therefore \r and \n must be escaped additionally.
// For example: \r becomes \\r, etc

const YAMLROUTE = `# Route
pattern: "/data/{*}.jpg"
pipeline:

  - type: process
    cmd: echo 'HEAD / HTTP/1.1\\r\\n\\r\\n'

  - type: tcp
    address: golang.org:80

  - type: process
    cmd: cat /dev/stdin`

const YAML = `collection:

# Route
- pattern: "/foo/bar"
  pipeline:

    - type: tcp
      address: geoiphost:100500

# Route
- pattern: "/data/{*}.jpg"
  pipeline:

    - type: process
      cmd: echo 'HEAD / HTTP/1.1\\r\\n\\r\\n'

    - type: process
      cmd: cat /dev/stdin

# Route
- pattern: "{*}"
  pipeline:

    - type: process
      cmd: echo -n 'nobody home...'`

// func TestUnmarshalYAML(t *testing.T) {
// 	t.Run("route", func(t *testing.T) {
// 		var inner innerRoute // inner route type
//
// 		if err := yaml.Unmarshal([]byte(YAMLROUTE), &inner); err != nil {
// 			t.Fatal(err)
// 		}
//
// 		// check route final data
// 		// convert to outer route type (router.Route)
// 		outer := router.Route(inner)
// 		if expectedPattern := "^/?data/(?:.*).jpg"; outer.Pattern.String() != expectedPattern {
// 			t.Fatalf("Expected %q, got %q", expectedPattern, outer.Pattern.String())
// 		}
//
// 		pline, ok := outer.Step.(pipeline.Pipeline)
// 		if !ok {
// 			t.Fatal("Unexpected step type (expected pipeline.Pipeline)")
// 		}
// 		if len(pline) != 3 {
// 			t.Fatal("Unexpected pipeline length (expected 3)")
// 		}
// 	})
//
// 	t.Run("router", func(t *testing.T) {
// 		var inner innerRouter // inner router type
//
// 		if err := yaml.Unmarshal([]byte(YAML), &inner); err != nil {
// 			t.Fatal(err)
// 		}
//
// 		t.Fatal(inner)
// 	})
// }

func TestRouteUnmarshalYAML(t *testing.T) {
	var router Router

	if err := yaml.Unmarshal([]byte(YAML), &router); err != nil {
		t.Fatal(err)
	}

	// exist url
	t.Run("exist", func(t *testing.T) {
		url, err := url.Parse("data/foobar.jpg")
		if err != nil {
			t.Fatal(err)
		}

		route, err := router.Match(url)
		if err != nil {
			t.Fatal(err)
		}

		// fill the context
		ctx := context.Background()
		ctx = context.WithValue(ctx, "input", bytes.NewBuffer([]byte("foobar")))
		ctx = context.WithValue(ctx, "output", bytes.NewBuffer([]byte{}))

		if err := route.pipeline.Run(ctx); err != nil {
			t.Fatal(err)
		}
	})

	t.Run("default", func(t *testing.T) {
		url, err := url.Parse("/foobar/bar/baz")
		if err != nil {
			t.Fatal(err)
		}

		route, err := router.Match(url)
		if err != nil {
			t.Fatal(err)
		}

		// fill the context
		ctx := context.Background()
		ctx = context.WithValue(ctx, "input", bytes.NewBuffer([]byte{}))
		ctx = context.WithValue(ctx, "output", bytes.NewBuffer([]byte{}))

		if err := route.pipeline.Run(ctx); err != nil {
			t.Fatal(err)
		}

		// check result
		if outputString := fmt.Sprint(ctx.Value("output")); outputString != "nobody home..." {
			t.Fatalf("Expected %q, got %q", "nobody home...", outputString)
		}
	})
}
