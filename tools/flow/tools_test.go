package flow

import (
	"fmt"
	"reflect"
	"testing"
)

func TestTools(t *testing.T) {
	var foo Step = &dummy{}
	var bar Step = &dummy{}

	tableTests := []struct {
		in  []Step
		out []Step
	}{
		{nil, nil},
		{[]Step{}, nil},
		{[]Step{nil}, nil},
		{[]Step{nil, nil}, nil},
		{[]Step{nil, foo, nil, bar, nil}, []Step{foo, bar}},
	}
	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if out := normalize(tt.in...); !reflect.DeepEqual(out, tt.out) {
				t.Fatalf("expected %q, got %q", tt.out, out)
			}
		})
	}
}
