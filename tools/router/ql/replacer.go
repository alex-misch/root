package ql

import (
	"fmt"
	"strings"
)

var (
	// regex wrapper for get param with concrete value, where 1 - param name, 2 - param value
	ValueWrapper = "(?:^|&)%[1]s=(?P<%[1]s>%[2]s)(?:$|&)"
	// regex wrapper for get param without any required value, where 1 - param name
	UnvalueWrapper = "(?:^|&)%[1]s(?:=(?P<%[1]s>[^&#]*))?"
	// regex wrapper for binding part's regex to the general expression
	JoinWrapper = "(?=.*%s)"

	// universal string replacer replaces our base shortctus
	// can be used anywhere as string
	// for example:
	// {*} will be (?:.*)
	// {image:*} will be (?<image>.*)
	// TODO: expand the list as you like
	shortcuts = strings.NewReplacer(
		"*", ".*", // {*} will be .* in context of using
	)
)

// Replacer is function that returns reg expression as string from source
type Replacer func(string) string

// defaultReplacer replacer replaces entries as regexp non capturing group
var defaultReplacer Replacer = func(source string) string {
	// Prephase. check for empty source -> return fallback
	if strings.Trim(source, " ") == "" {
		return ""
	}
	return fmt.Sprintf("(?:%s)", shortcuts.Replace(source))
}

// groupReplacer returns replacer which replaces entries as regexp with group capturing
// group name provided for generation regexp
func groupReplacer(group string) Replacer {
	return func(source string) string {
		// Prephase. check for empty source -> return fallback
		if strings.Trim(source, " ") == "" {
			return ""
		}
		return fmt.Sprintf("(?<%s>%s)", group, shortcuts.Replace(source))
	}
}

// queryReplacer replacer replaces according to the logic of parsing GET parameters
// main idea and key concepts:
// there are some cases and states for get params:
// 1) exists {?:a&b&c}
// 2) exists and equal {?:a=foo&b&c=bar}
// 3) not exists {?:a=foo&!b&c=bar}
// 4) combine multiple (separate by '&')
// TODO: for now it is only AND condition -> how we can solve 'a OR b' in query?
var queryReplacer Replacer = func(source string) string {
	// Prephase. check for empty source -> return fallback
	if strings.Trim(source, " ") == "" {
		return ""
	}

	// Phase 1. Split params by special `ql` separator - & (like in query)
	parts := strings.Split(source, "&")
	reparts := make([]string, len(parts))

	for i, part := range parts {
		// Phase 2, get part's regex based on concrete value or not
		// split by `=`
		var regex string

		if items := strings.SplitN(part, "=", 2); len(items) == 2 && items[1] != "" {
			// case when value exists
			regex = fmt.Sprintf(ValueWrapper, strings.Trim(items[0], " "), items[1])
		} else {
			// case when value undefined - all is good
			regex = fmt.Sprintf(UnvalueWrapper, strings.Trim(items[0], " "))
		}

		// Phase 3. Join part's regex to common big regex
		reparts[i] = fmt.Sprintf(JoinWrapper, regex)
	}

	return fmt.Sprintf("^%s.*$", strings.Join(reparts, ""))
}
