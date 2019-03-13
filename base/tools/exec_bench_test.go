package tools

import (
	"reflect"
	"testing"
)

func BenchmarkCLISplit(b *testing.B) {
	input := `  bin
	-opt1 arg1
	--opt2=arg2
	--opt2.5 foo\ bar
	--opt3 'foo bar'
	--opt4="foo bar"
	-opt5 "foo's bar"
	  --opt7='foo= bar "baz"'
	--opt8='HEAD / HTTP/1.1\r\n\r\n'
	cmd  `

	words := []string{
		"bin",           // multiline (not trimmed)
		"-opt1", "arg1", // simple
		"--opt2=arg2",         // another simple
		"--opt2.5", "foo bar", // escaped single space
		"--opt3", "foo bar", // escaped group by quote (string) with space
		"--opt4=foo bar",     // escaped group by quote (weak) with space
		"-opt5", "foo's bar", // quote in quoted group (another)
		"--opt7=foo= bar \"baz\"",            // quote in quoted group (another) (not trimmed)
		"--opt8=HEAD / HTTP/1.1\\r\\n\\r\\n", // special symbols in argument (\r or \n or \t) (additional escaping - look at `special symbols` section below)
		"cmd",                                // (not trimmed)
	}

	if output := CLISplit(input); !reflect.DeepEqual(output, words) {
		b.Fatalf("Expected %q, got %q", words, output)
	}
}
