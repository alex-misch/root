package trust

import (
	"fmt"
	"reflect"
	"testing"
)

type node int

func (n node) Fingerprint() []byte {
	return []byte{byte(n)}
}

func TestCreate(t *testing.T) {
	tableTests := []struct {
		// input
		from Node
		to   Node
		// output
		err error
	}{
		{nil, nil, ErrWrongNode},
		{node(1), nil, ErrWrongNode},
		{nil, node(2), ErrWrongNode},
		{node(1), node(2), nil},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			_, err := Create(tt.from, tt.to)
			if !reflect.DeepEqual(err, tt.err) {
				t.Fatalf("Expected %q, got %q", tt.err, err)
			}
		})
	}
}

func TestCheck(t *testing.T) {
	marker, err := Create(node(1), node(2))
	if err != nil {
		t.Fatal(err)
	}

	tableTests := []struct {
		// input
		from Node
		to   Node
		// output
		condition bool
	}{
		{nil, nil, false},
		{node(1), nil, false},
		{nil, node(2), false},
		{node(1), node(2), true},  // wright direction, existing relation
		{node(2), node(1), false}, // relation are not vise versa
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if condition := Check(marker, tt.from, tt.to); condition != tt.condition {
				t.Fatalf("Expected \"%t\", got \"%t\"", tt.condition, condition)
			}
		})
	}
}
