package tools

import (
	"bufio"
	"bytes"
	"strings"
	"unicode"
	"unicode/utf8"
)

// cli is a bufio.SplitFunc to split incoming process raw string to words
// according to shell word splitting
// http://www.grymoire.com/Unix/Quote.html
func cli(data []byte, atEOF bool) (int, []byte, error) {
	// Skip leading spaces and newlines, etc
	start := 0
	for width := 0; start < len(data); start += width {
		var r rune
		r, width = utf8.DecodeRune(data[start:])
		if !unicode.IsSpace(r) {
			break
		}
	}

	// Scan until separator
	var escaped bool                                // force write rune and skip another logic
	var grouped bool                                // indicates that group between quotes is writing
	var condition func(rune) bool = unicode.IsSpace // condition used as separator (break signal) by default - space and newlines
	var token bytes.Buffer                          // final splitted part

	for i, width := start, 0; i < len(data); i += width {
		var r rune // current rune

		// get first rune and it's size
		r, width = utf8.DecodeRune(data[i:])

		// process rune
		switch {
		case escaped: // escaped character - skip this
			escaped = false    // don't forget to disable `escaped` mode
			token.WriteRune(r) // add escaped rune to buffer
		case r == '\\': // Single Character Quote
			escaped = true // set escaped to true for next sign
		case condition(r): // we catch break rune!
			// NOTE: opening and closing quotes not included in token
			return i + width, token.Bytes(), nil
		case IsQuote(r): // Quote
			if !grouped {
				// opening case
				// NOTE: opening and closing quotes not included in token
				condition = func(br rune) bool { return br == r } // set break rune to nearest same quote
				grouped = true                                    // set group iterating begin
				break
			}
			fallthrough
		default: // some another rune, skip
			token.WriteRune(r) // add rune to buffer
		}
	}
	// If we're at EOF, we have a final, non-empty, non-terminated word. Return it.
	if atEOF && len(data) > start {
		return len(data), data[start:], nil
	}
	// Request more data.
	return 0, nil, nil
}

func IsQuote(r rune) bool {
	switch r {
	case '\'', '"', '`':
		return true
	}

	return false
}

// ShellSplit parses an incoming string as shell words respecting shell rules
// and splits it into words slice
func CLISplit(input string) []string {
	// prepare string, trim spaces, etc
	input = strings.TrimFunc(input, unicode.IsSpace)

	// create scanner for rune to rune scanning
	scanner := bufio.NewScanner(strings.NewReader(input))

	// Set the split function for the scanning operation.
	scanner.Split(cli)

	words := make([]string, 0)

	// get the words
	for scanner.Scan() {
		if word := scanner.Text(); word != "" { // condition for case with spaces in the middle
			words = append(words, word)
		}
	}

	// NOTE: no cases with error, but be careful with this!
	// if err := scanner.Err(); err != nil {
	// 	return nil, err
	// }

	// empty words (incoming string "")
	if len(words) == 0 {
		return nil
	}

	return words
}
