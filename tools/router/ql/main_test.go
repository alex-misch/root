package ql

import (
	"fmt"
	"testing"
)

func TestRegexp(t *testing.T) {
	tableTests := []struct {
		pattern string // source
		out     string // expected value of String() method
	}{
		{"", "^$"},
		// cases with excaping
		{"{*}/geo/m.y", "^(?:.*)/geo/m\\.y$"},
		{"/geo?{*}", "^/geo\\?(?:.*)$"},
		{"/geo/{*}/foo/bar", "^/geo/(?:.*)/foo/bar$"},
		{"/geo/my", "^/geo/my$"},
		{"/foo/.+*?()|[]{}^$/bar", "^/foo/\\.\\+\\*\\?\\(\\)\\|\\[\\]\\^\\$/bar$"}, // all special chars (NOTE: without `{}` because it is out reserved chars)
		// regular cases
		{"^/{data|static}/{*}.{jpg|png|jpeg}$", "^/(?:data|static)/(?:.*)\\.(?:jpg|png|jpeg)$"},
		{"/{data|static}/{*}.{jpg|png|jpeg}", "^/(?:data|static)/(?:.*)\\.(?:jpg|png|jpeg)$"},
		{"^{data|static}/{*}.{jpg|png|jpeg}$", "^(?:data|static)/(?:.*)\\.(?:jpg|png|jpeg)$"},
		{"{data|static}/{*}.{jpg|png|jpeg}", "^(?:data|static)/(?:.*)\\.(?:jpg|png|jpeg)$"},
		// with naming
		{"/{store:data|static}/{*}.{expr:jpg|png|jpeg}", "^/(?P<store>data|static)/(?:.*)\\.(?P<expr>jpg|png|jpeg)$"},
	}

	for i, tt := range tableTests {
		finalExpr := Regexp(tt.pattern).String()

		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if finalExpr != tt.out {
				t.Fatalf("Expected %q, got %q", tt.out, finalExpr)
			}
		})
	}
}
