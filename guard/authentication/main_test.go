package authentication

import (
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

func (ch chall) Fingerprint() []byte                                      { return []byte(fmt.Sprintf("challenge%d", ch)) }
func (ch chall) Ask(channel Channel) error                                { return nil }
func (ch chall) Check(node trust.Node, aswer interface{}) (Marker, error) { return nil, nil }

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
			flow []Challenge
			node trust.Node
			hook trust.NodeHook
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
			{flow, nil, hookSuccess, []Marker{ch1n2, ch2n2}, nil, node("2")}, // wright chain, all passed, hook returns sucess
			{flow, nil, hookError, []Marker{ch1n2, ch2n2}, ch1, nil},         // wright chain, all passed, but hook returns error, node invalid, begin all
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				tournament := tournament{
					chs:  tt.flow,
					node: tt.node,
					hook: tt.hook,
				}

				// check returned challenge
				if challenge := tournament.Get(tt.markers); challenge != tt.challenge {
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
}
