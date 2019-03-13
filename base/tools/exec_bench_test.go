package tools

import (
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

	for i := 0; i < b.N; i++ {
		CLISplit(input)
	}
}
