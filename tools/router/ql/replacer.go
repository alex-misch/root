package ql

import (
	"fmt"
	"strings"
)

type Replacer func(string) string

// defaultReplacer replacer replaces with non capturing group
var defaultReplacer Replacer = func(source string) string {
	return fmt.Sprintf("(?:%s)", strings.NewReplacer(
		"*", ".*", // {*} will be (?:.*)
	).Replace(source))
}

// groupReplacer returns replacer which replaces with group capturing
// group name provided for generation regexp
func groupReplacer(group string) Replacer {
	return func(source string) string {
		return fmt.Sprintf("(?<%s>%s)", group, strings.NewReplacer(
			"*", ".*", // {param:*} will be (?<param>.*)
		).Replace(source))
	}
}

// queryReplacer replacer replaces according to the logic of parsing GET parameters
// main idea and key concepts:
// there are some cases and states for get params:
// 1) exists {?:a,b,c}
// 2) exists and equal {?:a=foo,b,c=bar}
// 3) not exists {?:a=foo,!b,c=bar}
// 4) combine multiple (separate by ',')
var queryReplacer Replacer = func(source string) string {
	// Phase 1. Split params by special `ql` separator
	return ""
}
