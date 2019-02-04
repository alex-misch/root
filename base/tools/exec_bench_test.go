package tools

import (
	"testing"
)

func BenchmarkCliSplitFunc(b *testing.B) {
	data := []byte("bin -opt1 arg1 --opt2=arg2 --opt4='foo bar cmd")

	b.Run("[]byte", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			cli(data, true)
		}
	})

	// TODO: look for a better memory leak method
	// b.Run("bytes.Buffer", func(b *testing.B) {
	// 	for i := 0; i < b.N; i++ {
	// 		cli2(data, true)
	// 	}
	// })
}
