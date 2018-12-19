package ql

import (
	"fmt"
	"regexp"
	"strings"
)

var (
	bracketsRegexp = regexp.MustCompile("{.*?}") // lazy!!
)

// Bracket is some dynamic object in our pattern
// that must be converted to valid regex expression
type Bracket struct {
	source string
}

func NewBracket(source string) *Bracket {
	return &Bracket{
		// match may include leading and trailing '{}'
		source: strings.Trim(source, "{}"),
	}
}

// String implements fmt.Stringer interface
// String returns 'regex ready' source representation
func (b Bracket) String() string {
	return fmt.Sprintf("(?:%s)", strings.NewReplacer(
		"*", ".*", // {*} will be (?:.*)
	).Replace(b.source))
}
