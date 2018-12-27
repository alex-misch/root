package router

import (
	"regexp"
)

func MatchParams(re *regexp.Regexp, s string) (map[string]string, error) {
	// check `s` is valid and can be matched
	matches := re.FindStringSubmatch(s)
	if matches == nil {
		return nil, ErrUriInappropriate
	}

	// extract params
	names := re.SubexpNames()

	// check no params needed
	if len(names) == 1 {
		return nil, nil
	}

	// there is some capturing groups in pattern
	params := make(map[string]string)
	for i, name := range names {
		// unnamed group detected, skip
		if name == "" {
			continue
		}
		// fetch value by name and extend map
		if i > 0 && i <= len(matches) {
			params[name] = matches[i]
		}
	}

	// maybe there was not any named group
	if len(params) == 0 {
		return nil, nil
	}

	return params, nil
}
