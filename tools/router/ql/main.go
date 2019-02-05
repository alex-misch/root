// Package ql is some layer between regex and our simplified url and path format
package ql

import (
	"regexp"
	"strings"
)

var (
	bracketsRegexp = regexp.MustCompile("{.*?}") // lazy for catch only to the nearest closing tag!!
)

// Regexp returns complex regex for incoming pattern
// some several bases
// 1. expression will always starts with ^/
// 2. bracket source will be replaced by some condition (look at Bracket.String())
func Regexp(expr string) *regexp.Regexp {
	// Phase 1. Trim leading and trialing special symbols
	expr = strings.TrimLeft(expr, "^")  // trim from left all special regex chars
	expr = strings.TrimRight(expr, "$") // trim from right all special regex chars

	var final string // final regexp

	// Phase 2. Separate brackets and raw data. Raw data must be quoted. Brackets replaced by regex
	for {
		hit := bracketsRegexp.FindStringIndex(expr)
		if hit == nil {
			final += regexp.QuoteMeta(expr)
			break
		}

		// hit contains pair of integer
		// first - position of `{`, second - postition of `}`
		//
		// all before opening bracket - encode (raw part)
		final += regexp.QuoteMeta(expr[:hit[0]])
		// bracket content - covert
		final += NewBracket(expr[hit[0]:hit[1]]).String()
		// trim expression for next match
		expr = expr[hit[1]:]
	}

	// Phase 3. Add special chars and compile regexp
	return regexp.MustCompile("^" + final + "$")
}
