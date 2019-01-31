package tools

import (
	"fmt"
	"reflect"
	"testing"
)

func TestCLISplit(t *testing.T) {
	tableTests := []struct {
		input  string
		output []string
	}{
		// nil cases
		{"", nil},
		{" ", nil}, // space trimmed cases
		// complex case
		{
			`  bin
			-opt1 arg1
			--opt2=arg2
			--opt2.5 foo\ bar
			--opt3 'foo bar'
			--opt4="foo bar"
			-opt5 "foo's bar"
			-opt6 "foo\"s bar"
			  --opt7='foo= bar "baz"'
			cmd  `,
			[]string{
				"bin",           // multiline (not trimmed)
				"-opt1", "arg1", // simple
				"--opt2=arg2",         // another simple
				"--opt2.5", "foo bar", // escaped single space
				"--opt3", "foo bar", // escaped group by quote (string) with space
				"--opt4=foo bar",     // escaped group by quote (weak) with space
				"-opt5", "foo's bar", // quote in quoted group (another)
				"-opt6", "foo\"s bar", // quote in quoted group (same)
				"--opt7=foo= bar \"baz\"", // quote in quoted group (another) (not trimmed)
				"cmd",                     // (not trimmed)
			},
		},
		// extra cases
		{"bin --opt=\\'foo bar", []string{"bin", "--opt='foo", "bar"}}, // escape quote at beginning
		{"bin --opt='foo bar", []string{"bin", "--opt='foo bar"}},      // non closing quote
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if output := CLISplit(tt.input); !reflect.DeepEqual(output, tt.output) {
				t.Fatalf("Expected %q, got %q", tt.output, output)
			}
		})
	}
}

func TestIsQuote(t *testing.T) {
	tableTests := []struct {
		input  rune
		output bool
	}{
		{'"', true},
		{'\'', true},
		{'`', true},
		{'a', false},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if output := IsQuote(tt.input); output != tt.output {
				t.Fatalf("Expected \"%t\", got \"%t\"", tt.output, output)
			}
		})
	}
}
