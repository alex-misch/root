package trust

import (
	"fmt"
	"reflect"
	"testing"
)

func TestCreate(t *testing.T) {
	tableTests := []struct {
		// input
		from Node
		to   Node
		// output
		err error
	}{
		{nil, nil, ErrWrongNode},
		{Abstract([]byte{1}), nil, ErrWrongNode},
		{nil, Abstract([]byte{2}), ErrWrongNode},
		{Abstract([]byte{1}), Abstract([]byte{2}), nil},
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
	marker, err := Create(Abstract([]byte{1}), Abstract([]byte{2}))
	if err != nil {
		t.Fatal(err)
	}
	remarker, err := Create(Abstract([]byte{2}), Abstract([]byte{1}))
	if err != nil {
		t.Fatal(err)
	}

	tableTests := []struct {
		// input
		marker []byte
		from   Node
		to     Node
		// output
		err error
	}{
		{nil, nil, nil, ErrWrongNode},
		{nil, Abstract([]byte{1}), nil, ErrWrongNode},
		{nil, nil, Abstract([]byte{2}), ErrWrongNode},
		{[]byte("wrong"), Abstract([]byte{1}), nil, ErrWrongNode},
		{[]byte("wrong"), nil, Abstract([]byte{2}), ErrWrongNode},

		{[]byte("wrong"), Abstract([]byte{1}), Abstract([]byte{2}), ErrWrongMarker}, // wrong marker

		{remarker, Abstract([]byte{1}), Abstract([]byte{2}), ErrWrongMarker}, // wrong marker, existing relation
		{marker, Abstract([]byte{1}), Abstract([]byte{2}), nil},              // wright direction, existing relation

		{marker, Abstract([]byte{2}), Abstract([]byte{1}), ErrWrongMarker}, // relation are not vise versa (marker wrong)
		{remarker, Abstract([]byte{2}), Abstract([]byte{1}), nil},          // wright direction, existing relation
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if err := Check(tt.marker, tt.from, tt.to); !reflect.DeepEqual(err, tt.err) {
				t.Fatalf("Expected %q, got %q", tt.err, err)
			}
		})
	}
}

func TestOpen(t *testing.T) {
	from := Abstract([]byte{1})
	to := Abstract([]byte{2})
	marker, err := Create(from, to)
	if err != nil {
		t.Fatal(err)
	}

	tableTests := []struct {
		// input
		marker []byte
		from   Node
		// output
		to  Node
		err error
	}{
		{nil, nil, nil, ErrWrongNode},
		{nil, from, nil, ErrWrongMarker},
		{marker, nil, nil, ErrWrongNode},
		{marker, from, to, nil},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			to, err := Open(tt.marker, tt.from)
			if !reflect.DeepEqual(err, tt.err) {
				t.Fatalf("Expected %q, got %q", tt.err, err)
			}
			if !reflect.DeepEqual(to, tt.to) {
				t.Fatalf("Expected %q, got %q", tt.to, to)
			}
		})
	}
}
