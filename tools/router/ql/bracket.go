package ql

import (
	"regexp"
	"strings"
)

var (
	bracketsRegexp = regexp.MustCompile("{.*?}") // lazy!!
)

// Bracket is some dynamic object in our pattern
// that must be converted to valid regex expression
//
// NOTE: main idea: bracket can be transformed to regex
// transformation rule: final = wrapper( replacer( source ) )
// where replacer replaces out shortcuts to regex expression
// wrapper describes which replacer to use
//
// example: {?:a&b&c=foo} means that we will replace source (a&b&c=foo) according to wrapper for GET query params (?:)
type Bracket string

func NewBracket(source string) Bracket {
	return Bracket(
		// match from regexp may include leading and trailing '{}'
		strings.Trim(source, "{}"),
	)
}

// String implements fmt.Stringer interface
// String returns 'regex ready' source representation
func (b Bracket) String() string {
	// Phase 1. Get wrapper and associated replacer
	var wrapper, source string

	if parts := strings.SplitN(string(b), ":", 2); len(parts) == 2 {
		// case when wrapper part exists
		wrapper = parts[0]
		source = parts[1]
	} else {
		// case when default wrapper must be used
		source = parts[0]
	}

	// Middle phase. is source empty - nothing to do - empty logic
	if source == "" {
		return ""
	}

	var replacer Replacer

	// NOTE: expand the list of functionality here
	switch wrapper {
	case "?": // we translating get params query
		replacer = queryReplacer
	case "": // we tranlsting usual regex non capturing group
		replacer = defaultReplacer
	default: // we tranlsting usual regex with capturing content
		replacer = groupReplacer(wrapper) // get replacer by group name (group name parsed from wrapper part)
	}

	// Phase 2. Get final regexp from parsed source accorfing to chosen wrapper
	return replacer(source)
}
