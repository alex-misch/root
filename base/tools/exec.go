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
	var includeConditionRune bool        // does we need to include rune on which disables escape mode (closing rune)
	var escaped bool                     // force write rune and skip another logic
	var condition func(r0, r1 rune) bool // condition used as separator (break signal) by default - space and newlines
	var token bytes.Buffer               // final splitted part (word)

	for i, width := start, 0; i < len(data); i += width {
		var r rune // current rune

		r, width = utf8.DecodeRune(data[i:])     // get first rune and it's size
		r2, _ := utf8.DecodeRune(data[i+width:]) // get next rune

		// set flags and process rune
		switch {
		// case for disabling escaped mode if confition
		case escaped:
			if condition(r, r2) { // closing
				if includeConditionRune {
					token.WriteRune(r)
				}
				escaped = false
				includeConditionRune = false

			} else {
				token.WriteRune(r)
			}

		// next cases is for check does we need enable escaping
		case r == '\\': // Single Character Quote
			escaped = true
			includeConditionRune = true
			condition = func(r0, r1 rune) bool { return true } // disable escape on next

		case IsQuote(r): // Quote
			escaped = true
			condition = func(r0, r1 rune) bool { return r0 == r } // disable escape when rune is same quote

		case r == '{' && r2 == '{': // interpolation
			escaped = true
			includeConditionRune = true
			condition = func(r0, r1 rune) bool { return r0 == '}' && r1 == '}' } // disable escape on closing interpolation tags
			token.WriteRune(r)

		// this case return splitted word by space or newline (if we are not in escape mode)
		case !escaped && unicode.IsSpace(r):
			return i + width, token.Bytes(), nil

		default:
			token.WriteRune(r)
		}
	}

	// If we're at EOF, we have a final, non-empty, non-terminated word. Return it.
	if atEOF && len(data) > start {
		return len(data), token.Bytes(), nil
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
