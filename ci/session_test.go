package ci

import (
	"testing"
)

func TestSession(t *testing.T) {
	session, err := NewSession("https://github.com/agurinov/root")
	if err != nil {
		t.Fatal("ERROR:", err)
	}

	if err := session.Run(); err != nil {
		t.Fatal("ERROR:", err)
	}
}
