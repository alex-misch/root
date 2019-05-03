package authentication

import (
	// "encoding/hex"
	"errors"
	"fmt"
	"reflect"
	"testing"

	"github.com/boomfunc/root/guard/trust"
)

// dummy types for tests
//
// node is the dummy node that tries to authenticate
type node string

func (n node) Fingerprint() []byte { return []byte(fmt.Sprintf("node.%s", n)) }

// chall is dummy challenge
type chall int

func (ch chall) Fingerprint() []byte                          { return []byte(fmt.Sprintf("challenge.%d", ch)) }
func (ch chall) Ask(_ trust.ArtifactHook, _ trust.Node) error { return nil }
func (ch chall) Answer(_ trust.ArtifactHook, _ trust.Node, _ []byte) (trust.Node, error) {
	return node("1"), nil
}

func TestTournament(t *testing.T) {
	var ch1 Challenge = chall(1)
	var ch2 Challenge = chall(2)
	var flow []Challenge = []Challenge{ch1, ch2}

	t.Run("Get", func(t *testing.T) {
		hookSuccess := func(n trust.Node) (trust.Node, error) { return n, nil }
		hookError := func(n trust.Node) (trust.Node, error) { return nil, errors.New("OOPS") }

		ch1n1, _ := NewMarker(ch1, node("1")) // marker for 1 challenge for 1 node
		ch1n2, _ := NewMarker(ch1, node("2")) // marker for 1 challenge for 2 node
		ch2n1, _ := NewMarker(ch2, node("1")) // marker for 2 challenge for 1 node
		ch2n2, _ := NewMarker(ch2, node("2")) // marker for 2 challenge for 2 node

		tableTests := []struct {
			// initialization
			flow   []Challenge
			node   trust.Node
			getter trust.NodeHook
			// input
			markers []Marker
			// output
			challenge Challenge
			outnode   trust.Node // which node will be saved in tournament
		}{
			// nil values
			{nil, nil, nil, nil, nil, nil},
			{nil, nil, nil, []Marker{[]byte("wrong")}, nil, nil},
			{[]Challenge{}, nil, nil, nil, nil, nil},

			// wrong markers
			{flow, nil, nil, nil, ch1, nil},
			{flow, nil, nil, []Marker{}, ch1, nil},
			{flow, nil, nil, []Marker{nil, nil}, ch1, nil},
			{flow, nil, nil, []Marker{[]byte("wrong")}, ch1, nil}, // fake marker

			// marker for 1 node and 1 challenge - must be returned second challenge
			// also node("1") freezes as tournament.node
			{flow, nil, nil, []Marker{ch1n1}, ch2, node("1")}, // marker for node1
			{flow, nil, nil, []Marker{ch1n2}, ch2, node("2")}, // marker for node1

			// wright markers for wrong nodes
			{flow, node("2"), nil, []Marker{ch1n1}, ch1, node("2")}, // marker for `node1`, but tournament for `node2`
			{flow, node("1"), nil, []Marker{ch1n2}, ch1, node("1")}, // marker for `node1`, but tournament for `node2`

			// wright cases
			{flow, nil, nil, []Marker{ch1n1, ch2n1}, nil, node("1")},       // wright chain, all passed
			{flow, node("1"), nil, []Marker{ch1n1, ch2n1}, nil, node("1")}, // wright chain, all passed
			{flow, nil, nil, []Marker{ch1n2, ch2n2}, nil, node("2")},       // wright chain, all passed
			{flow, node("2"), nil, []Marker{ch1n2, ch2n2}, nil, node("2")}, // wright chain, all passed

			// some cases with broken chains
			{flow, node("2"), nil, []Marker{ch1n1, ch2n1}, ch1, node("2")}, // wright chain, but tournament for another user
			{flow, node("2"), nil, []Marker{ch1n2, ch2n1}, ch2, node("2")}, // wrong chain, second challenge undone
			{flow, node("1"), nil, []Marker{ch1n2, ch2n1}, ch1, node("1")}, // wrong chain, first challenge undone
			{flow, node("1"), nil, []Marker{ch2n1, ch1n1}, ch1, node("1")}, // wrong chain, first challenge undone
			{flow, nil, nil, []Marker{ch2n1, ch1n1}, ch1, nil},             // wrong chain, first challenge undone

			// cases with hooks
			// get some case above and test it for two variants: with error or none
			{flow, nil, hookSuccess, []Marker{ch1n2, ch2n2}, nil, node("2")}, // wright chain, all passed, `getter` hook returns sucess
			{flow, nil, hookError, []Marker{ch1n2, ch2n2}, ch1, nil},         // wright chain, all passed, but `getter` hook returns error, node invalid, begin all
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				tournament := tournament{
					chs:    tt.flow,
					node:   tt.node,
					getter: tt.getter,
				}

				// check returned challenge
				if challenge := tournament.get(tt.markers); challenge != tt.challenge {
					t.Fatalf("Expected %q, got %q", tt.challenge, challenge)
				}

				// also check inner node verification
				if tt.outnode == nil {
					if tournament.node != nil {
						t.Fatalf("Expected %v, got %q", nil, tournament.node)
					}
				} else {
					if tournament.node == nil {
						t.Fatalf("Expected %q, got %v", tt.outnode, nil)
					} else if !reflect.DeepEqual(tournament.node.Fingerprint(), tt.outnode.Fingerprint()) {
						t.Fatalf("Expected %q, got %q", tt.outnode.Fingerprint(), tournament.node.Fingerprint())
					}
				}
			})
		}
	})

	t.Run("chown", func(t *testing.T) {
		real := node("real")
		abstract := trust.Abstract([]byte("node.real"))
		getter := func(node trust.Node) (trust.Node, error) { return real, nil }

		tableTests := []struct {
			initial trust.Node
			getter  trust.NodeHook
			set     trust.Node
			// output
			node trust.Node
			err  error
		}{
			// if we setting empty node - no care about getter and existing node
			{nil, nil, nil, nil, trust.ErrWrongNode},
			{real, nil, nil, real, trust.ErrWrongNode},
			{abstract, nil, nil, abstract, trust.ErrWrongNode},
			{nil, getter, nil, nil, trust.ErrWrongNode},
			{real, getter, nil, real, trust.ErrWrongNode},
			{abstract, getter, nil, abstract, trust.ErrWrongNode},

			// if node already in tournament - means that it is real and confirmed
			// just check fingerprint
			{real, nil, real, real, nil},
			{real, nil, abstract, real, nil},
			{abstract, nil, real, abstract, nil},
			{abstract, nil, abstract, abstract, nil},
			{real, getter, real, real, nil},
			{real, getter, abstract, real, nil},
			{abstract, getter, real, abstract, nil},
			{abstract, getter, abstract, abstract, nil},

			// without getter
			{nil, nil, real, real, nil},
			{nil, nil, abstract, abstract, nil},

			// with getter
			{nil, getter, real, real, nil},
			{nil, getter, abstract, real, nil},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				trnmnt := &tournament{
					node:   tt.initial,
					getter: tt.getter,
				}

				if err := trnmnt.chown(tt.set); !reflect.DeepEqual(err, tt.err) {
					t.Errorf("Expected %q, got %q", tt.err, err)
				}

				if !reflect.DeepEqual(trnmnt.node, tt.node) {
					t.Errorf("Expected %v, got %v", tt.node, trnmnt.node)
				}
			})
		}
	})
}

func TestSignIn(t *testing.T) {
	// describe per project authentication flow
	flow := []Challenge{
		&LoginPwdChallenge{},
		PinChallenge(4),
	}

	// in view create per user tournament
	tournament := Tournament(
		flow,
		nil, nil, nil,
		// func(node trust.Node) (trust.Node, error) { return nil, ErrChallengeFailed },
	)
	// m1, _ := hex.DecodeString("3c2882744633325901b3af4c14bcc27485e1406b85af67668600dcd6e24ca3f16f81")
	// m2, _ := hex.DecodeString("c69c719fcd1751573c20ac8b9fa6547b10b217027af2796aa81e95825c490425a84b")

	// m1, _ := hex.DecodeString("1e9c5bb1d4d3b93005486d80b4cac1b12c69676477da2d2940a1305c5ca4545e7e4e")
	// m2, _ := hex.DecodeString("2163890d2ad93cdca2389f847072c83a132519593bf31357a4b17a09900d6c4ee7af")

	// markers := []Marker{m1, m2}
	markers := []Marker{}
	answers := [][]byte{
		[]byte("rootpwd"),
		[]byte("1234"),
	}

	for i := 0; ; i++ {
		// Phase 1. Ask for pass challenge
		if err := tournament.Ask(markers); err != nil {
			if err == Complete {
				break
			}
			t.Fatal(err)
		}

		// Phase 2. Close challenge
		marker, err := tournament.Answer(markers, answers[i])
		if err != nil {
			if err == Complete {
				break
			}
			t.Fatal(err)
		}
		// update marker state
		if len(markers) < i+1 {
			markers = append(markers, marker)
		} else {
			markers[i] = marker
		}
	}

	// Check output
	// t.Error("=====", string(tournament.node.Fingerprint()))
	for i, marker := range markers {
		t.Log(marker.ToCookie(i).String())
	}
	// t.Error("=====")
}
