package session

// import (
// 	"testing"
//
// 	"github.com/boomfunc/log"
// 	"github.com/boomfunc/root/ci/step"
// )
//
// func TestSession(t *testing.T) {
// 	log.SetDebug(true)
//
// 	session, err := NewSession("https://github.com/agurinov/root")
// 	if err != nil {
// 		t.Fatal("Creation session error: ", err)
// 	}
//
// 	t.Logf("Session `%s` is runnning", session.UUID)
//
// 	if err := step.Run(session); err != nil {
// 		t.Fatal("Session run error: ", err)
// 	} else {
// 		t.Log("Session successful!")
// 	}
// }
