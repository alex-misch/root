package authentication

import (
	"fmt"
	"testing"
)

var (
	ch1  Challenge  = &PwdChallenge{login: "gura"}
	ch2  Challenge  = &PwdChallenge{login: "gura2"}
	flow Challenges = []Challenge{ch1, ch2}
)

func TestChallenges(t *testing.T) {
	t.Run("Get", func(t *testing.T) {
		tableTests := []struct {
			flow      Challenges
			markers   []Marker
			challenge Challenge
		}{
			{nil, nil, nil},
			{nil, nil, nil},
			{nil, []Marker{}, nil},
			{nil, []Marker{[]byte("session")}, nil},
			{nil, []Marker{[]byte("session"), []byte("session")}, nil},

			{flow, nil, ch1},
			{flow, nil, ch1},
			{flow, []Marker{}, ch1},
			{flow, []Marker{[]byte("session")}, ch2},
			{flow, []Marker{[]byte("wrong")}, ch1},
			{flow, []Marker{[]byte("wrong"), []byte("session")}, ch1},
			{flow, []Marker{[]byte("session"), []byte("wrong")}, ch2},
			{flow, []Marker{[]byte("session"), []byte("session")}, nil},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if challenge := tt.flow.Get(tt.markers); challenge != tt.challenge {
					t.Fatalf("Expected %q, got %q", tt.challenge, challenge)
				}
			})
		}
	})
}

func TestDo(t *testing.T) {

}

// 	tableTests := []struct {
// 		flow Challenges
// 		markers Markers
// 		err error
// 	}{
// 		{nil, nil, nil},
// 		{nil, Markers(nil), nil},
// 		{nil, Markers([]string{}), nil},
// 		{nil, Markers([]string{"session"}), nil},
// 		{nil, Markers([]string{"session", "session"}), nil},
//
// 		{flow, nil, nil},
// 		{flow, Markers(nil), nil},
// 		{flow, Markers([]string{}), nil},
// 		{flow, Markers([]string{"session"}), nil},
// 		{flow, Markers([]string{"session", "session"}), nil},
// 	}
//
// 	for i, tt := range tableTests {
// 		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
// 			if err := do(tt.flow, tt.markers); err != tt.err {
// 				t.Fatalf("Expected %q, got %q", tt.err, err)
// 			}
// 		})
// 	}
// }
