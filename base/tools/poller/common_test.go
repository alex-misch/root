package poller

import (
	"fmt"
	"os"
	"testing"
)

func TestPollerPublic(t *testing.T) {
	poller, _ := New()
	r, w, _ := os.Pipe()

	t.Run("Add", func(t *testing.T) {
		// Success adding
		if err := poller.Add(r.Fd()); err != nil {
			t.Fatal(err)
		}
		if err := poller.Add(w.Fd()); err != nil {
			t.Fatal(err)
		}

		// Duplicate adding -> error
		if err := poller.Add(r.Fd()); err == nil {
			t.Fatal("Expecting error during Add(r)")
		}
		if err := poller.Add(w.Fd()); err == nil {
			t.Fatal("Expecting error during Add(w)")
		}
	})

	t.Run("Del", func(t *testing.T) {
		// Success deleting
		if err := poller.Del(r.Fd()); err != nil {
			t.Fatal(err)
		}
		if err := poller.Del(w.Fd()); err != nil {
			t.Fatal(err)
		}

		// Duplicate adding -> error
		if err := poller.Del(r.Fd()); err == nil {
			t.Fatal("Expecting error during Del(r)")
		}
		if err := poller.Del(w.Fd()); err == nil {
			t.Fatal("Expecting error during Del(w)")
		}
	})

	t.Run("Events", func(t *testing.T) {
		poller.Add(r.Fd())
		poller.Add(w.Fd())

		re, ce, err := poller.Events()
		if err != nil {
			t.Fatal(err)
		}
		// now only w part is ready for writing -> len == 1
		if len(re) != 0 {
			t.Fatal("Unexpected number of read events, expected 0")
		}
		if len(ce) != 0 {
			t.Fatal("Unexpected number of closed events, expected 0")
		}

		// write imitation
		fmt.Fprint(w, "some playload")

		re, ce, err = poller.Events()
		if err != nil {
			t.Fatal(err)
		}
		// now w and r parts is ready -> len == 2
		if len(re) != 1 {
			t.Fatal("Unexpected number of read events, expected 1")
		}
		if len(ce) != 0 {
			t.Fatal("Unexpected number of closed events, expected 0")
		}
		if re[0].Fd() != r.Fd() {
			t.Fatal("Unexpected event fd")
		}
	})
}
