package tools

import (
	"fmt"
	"reflect"
	"testing"
)

func TestShellSplit(t *testing.T) {
	tableTests := []struct {
		input  string
		output []string
	}{
		// common cases
		{"", nil},
		{"bin", []string{"bin"}},
		{"bin cmd", []string{"bin", "cmd"}},
		{"bin -opt cmd", []string{"bin", "-opt", "cmd"}},
		{"bin -opt arg cmd", []string{"bin", "-opt", "arg", "cmd"}},
		{"bin -opt arg --option=arg cmd", []string{"bin", "-opt", "arg", "--option=arg", "cmd"}},
		{"bin -opt1 arg1 --opt2=arg2 -opt3=arg3 cmd", []string{"bin", "-opt1", "arg1", "--opt2=arg2", "-opt3=arg3", "cmd"}},
		// escaping and quoting cases
		{`bin 'foo bar'`, []string{"bin", "foo bar"}},
		{`bin "foo bar"`, []string{"bin", "foo bar"}},
		{`bin --option="foo bar"`, []string{"bin", "--option=foo bar"}},
		{`bin --option="foo's bar"`, []string{"bin", "--option=foo's bar"}},
		{"bin --option=`foo\"s 'baz' bar`", []string{"bin", "--option=foo\"s 'baz' bar"}},
		{"bin --option='foo's bar'", []string{"bin", "--option=foo's bar"}}, // escaped inside argument
		// space trimmed cases
		{" ", nil},
		{` bin --option="foo bar"  `, []string{"bin", "--option=foo bar"}},
		{` bin   --option="foo bar"  `, []string{"bin", "--option=foo bar"}}, // multiple spaces in the middle
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if output := ShellSplit(tt.input); !reflect.DeepEqual(output, tt.output) {
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
