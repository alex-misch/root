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
		t.Run("read", func(t *testing.T) {
			if err := poller.Add(r.Fd()); err != nil {
				t.Fatal(err)
			}

			// now it is nothing to read - .Events() will block function
			// write imitation
			fmt.Fprint(w, "some playload")

			re, ce, err := poller.Events()
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

		t.Run("close", func(t *testing.T) {
			r, w, _ := os.Pipe()

			if err := poller.Add(r.Fd()); err != nil {
				t.Fatal(err)
			}

			// now it is nothing to read - .Events() will block function
			// close imitation
			if err := w.Close(); err != nil {
				t.Fatal(err)
			}

			re, ce, err := poller.Events()
			if err != nil {
				t.Fatal(err)
			}
			// now w and r parts is ready -> len == 2
			if len(re) != 0 {
				t.Fatal("Unexpected number of read events, expected 0")
			}
			if len(ce) != 1 {
				t.Fatal("Unexpected number of closed events, expected 1")
			}
			if ce[0].Fd() != r.Fd() {
				t.Fatal("Unexpected event fd")
			}
		})

		t.Run("mixed", func(t *testing.T) {
			// case when we write to pipe and than closes it - only one event must be fetched (closing)
			r, w, _ := os.Pipe()

			if err := poller.Add(r.Fd()); err != nil {
				t.Fatal(err)
			}
			if err := poller.Add(w.Fd()); err != nil {
				t.Fatal(err)
			}

			fmt.Fprint(w, "some playload") //write imitation
			w.Close()                      // close imitation

			re, ce, err := poller.Events()
			if err != nil {
				t.Fatal(err)
			}
			// now w and r parts is ready -> len == 2
			if len(re) != 0 {
				t.Fatal("Unexpected number of read events, expected 0")
			}
			if len(ce) != 1 {
				t.Fatal("Unexpected number of closed events, expected 1")
			}
			if ce[0].Fd() != r.Fd() {
				t.Fatal("Unexpected event fd")
			}
		})
	})
}
