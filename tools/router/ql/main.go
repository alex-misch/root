// Package ql is some layer between regex and our simplified url and path format
package ql

import (
	"fmt"
	"regexp"
	"strings"
)

// Regexp returns complex regex for incoming pattern
// some several bases
// 1. expression will always starts with ^/
// 2. bracket source will be replaced by some condition (look at Bracket.String())
func Regexp(source string) *regexp.Regexp {
	expr := bracketsRegexp.ReplaceAllStringFunc(source, func(source string) string {
		return NewBracket(source).String()
	})

	expr = strings.TrimLeft(expr, "/^") // trim from left all special regex chars
	// string begin with non required leading `/`
	// NOTE: leading `/` must be lazy because if URL begins with capturing group therefore slash must be included
	expr = fmt.Sprintf("^/??%s", expr)

	return regexp.MustCompile(expr)
}
