package pipeline

import (
	"reflect"
	"testing"
)

func TestProcess(t *testing.T) {
	var orig *process
	var copy *process

	t.Run("NewProcess", func(t *testing.T) {
		orig = NewProcess("echo 'foo bar'").(*process)

		// check raw data
		if orig.cmd != "echo 'foo bar'" {
			t.Fatalf("Expected %q, got %q", "echo 'foo bar'", orig.cmd)
		}

		if l := len(*(orig.parts)); l != 0 {
			t.Fatalf("orig.len: Expected %q, got %q", 0, l)
		}
	})

	t.Run("copy", func(t *testing.T) {
		copy = orig.copy().(*process)

		// check raw data
		if copy.cmd != "echo 'foo bar'" {
			t.Fatalf("Expected %q, got %q", "echo 'foo bar'", copy.cmd)
		}

		if l := len(*(copy.parts)); l != 0 {
			t.Fatalf("copy.len: Expected %q, got %q", 0, l)
		}

		// check parts - must refer to same slice
		if reflect.ValueOf(orig.parts).Pointer() != reflect.ValueOf(copy.parts).Pointer() {
			t.Fatal("`orig` and `copy` refers to different `parts` slices")
		}
	})

	t.Run("prepare", func(t *testing.T) {
		// first prepare invoke - must be splitted and changed parts on orig and copy
		if err := copy.prepare(nil); err != nil {
			t.Fatal(err)
		}

		// check parts on copy
		if expected := []string{"echo", "foo bar"}; !reflect.DeepEqual(*(copy.parts), expected) {
			t.Fatalf("Expected %q, got %q", expected, *(copy.parts))
		}

		// check parts on original
		if expected := []string{"echo", "foo bar"}; !reflect.DeepEqual(*(orig.parts), expected) {
			t.Fatalf("Expected %q, got %q", expected, *(orig.parts))
		}

		if reflect.ValueOf(orig.parts).Pointer() != reflect.ValueOf(copy.parts).Pointer() {
			t.Fatal("`orig` and `copy` refers to different `parts` slices")
		}
	})
}
