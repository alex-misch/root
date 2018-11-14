package ci

import (
	"testing"

	"github.com/boomfunc/root/ci/step"
)

func TestSession(t *testing.T) {
	session, err := NewSession("https://github.com/agurinov/root")
	if err != nil {
		t.Fatal("ERROR:", err)
	}

	if err := step.Run(session); err != nil {
		t.Fatal("ERROR:", err)
	}
}
