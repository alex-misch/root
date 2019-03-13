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
			  --opt7='foo= bar "baz"'
			--opt8='HEAD / HTTP/1.1\r\n\r\n'
			cmd  `,
			[]string{
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
			},
		},
		// extra cases
		{"bin --opt=\\'foo bar", []string{"bin", "--opt='foo", "bar"}}, // escape quote at beginning
		{"bin --opt='foo bar", []string{"bin", "--opt=foo bar"}},       // non closing quote
		// special symbols
		{"bin --opt='HEAD / HTTP/1.1\r\n\r\n'", []string{"bin", "--opt=HEAD / HTTP/1.1\r\n\r\n"}},     // special symbols through quoting
		{`bin --opt='HEAD / HTTP/1.1\r\n\r\n'`, []string{"bin", "--opt=HEAD / HTTP/1.1\\r\\n\\r\\n"}}, // special symbols through backticks
		// interpolation cases
		{
			`node
			--url='/{{url "url"}}'
			--ip={{meta "ip"}}`,
			[]string{
				"node",
				"--url=/{{url \"url\"}}", // escaped
				"--ip={{meta \"ip\"}}",   // non escaped - same result
			},
		},
		{`node   --url=/{{meta "url"}} --ip={{meta "ip"}}  --user-agent='{{meta "ua"}}'`, []string{"node", "--url=/{{meta \"url\"}}", "--ip={{meta \"ip\"}}", "--user-agent={{meta \"ua\"}}"}},
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
