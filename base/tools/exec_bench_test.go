package tools

import (
	"testing"
)

func BenchmarkCLISplit(b *testing.B) {
	for i := 0; i < b.N; i++ {
		CLISplit(`node   --url=/{{meta "url"}} --ip={{meta "ip"}}  --user-agent='{{meta "ua"}}'`)
	}
}
