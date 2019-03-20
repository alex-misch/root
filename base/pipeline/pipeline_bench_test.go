package pipeline

import (
	"context"
	"fmt"
	"os"
	"testing"

	"github.com/boomfunc/root/base/tools"
)

func BenchmarkPipeline(b *testing.B) {
	for i := 0; i < b.N; i++ {
		b.StopTimer()

		r1, w1, err := os.Pipe()
		if err != nil {
			b.Fatal(err)
		}

		_, w2, err := os.Pipe()
		if err != nil {
			b.Fatal(err)
		}

		go func() {
			fmt.Fprint(w1, "foobar")
			w1.Close()
		}()

		ctx := context.Background()
		ctx = context.WithValue(ctx, "input", tools.ReadCloser(r1))
		ctx = context.WithValue(ctx, "output", tools.WriteCloser(w2))

		b.StartTimer()

		New(
			NewProcess("/bin/cat /dev/stdin"), // read 'foobar' from stdin
			NewProcess("/usr/bin/rev"),        // reverse -> raboof
			NewProcess("/bin/grep -o raboof"), // grep reversed (must be 1 match)
			NewProcess("/usr/bin/wc -l"),      // count matches
		).Run(ctx)

	}
}
