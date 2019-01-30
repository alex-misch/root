package tools

import (
	"bufio"
	"bytes"
	"strings"
	"unicode"
	"unicode/utf8"
)

func IsQuote(r rune) bool {
	switch r {
	case '\'', '"', '`':
		return true
	}

	return false
}

// ShellSplit parses an incoming string as shell words respecting shell rules
// and splits it into words slice
func ShellSplit(input string) []string {
	// prepare string, trim spaces, etc
	input = strings.TrimFunc(input, unicode.IsSpace)

	// split is a bufio.SplitFunc to split incoming process raw string
	// to words in priority delimiter
	// quotes have the highest priority
	// if no occurs - space is used for splitting
	split := func(data []byte, atEOF bool) (advance int, token []byte, err error) {
		// the condition is a function which determines whether the rune is a quote separator
		var condition func(r rune) bool
		start := 0

		// Scan until space, marking end of word.
		for width, i := 0, start; i < len(data); i += width {
			// get rune for processing
			var r rune
			r, width = utf8.DecodeRune(data[i:])

			// check rune is valid quote for changing closing condition
			if IsQuote(r) {
				if condition == nil { // no condition set and quote deteccted - opening quote
					// quote opening detected - change condition and go to next same closing rune
					condition = func(inner rune) bool { return inner == r }
					continue
				} else if condition(r) { // condition set, openening quote already passed, wait for closing
					// closing case
					// return i + width, data[start:i], nil
					return i + width, bytes.Replace(data[start:i], []byte{byte(r)}, nil, 1), nil
				}
			} else if condition == nil && unicode.IsSpace(r) { // simple logic with spaces (in case we don't wait quote)
				return i + width, data[start:i], nil
			}
		}
		// If we're at EOF, we have a final, non-empty, non-terminated word. Return it.
		if atEOF && len(data) > start {
			return len(data), data[start:], nil
		}
		// Request more data.
		return start, nil, nil
	}

	// create scanner for rune to rune scanning
	scanner := bufio.NewScanner(strings.NewReader(input))

	// Set the split function for the scanning operation.
	scanner.Split(split)

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
