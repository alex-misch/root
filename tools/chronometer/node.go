package chronometer

import (
	"fmt"
	"time"
)

type Node struct {
	enter time.Time
	exit  time.Time
}

func NewNode() *Node {
	return &Node{
		enter: time.Now(),
	}
}

// Duration returns measured node life time
// returns time.Duration
func (node *Node) Duration() time.Duration {
	if node.enter.IsZero() {
		return 0
	}

	if node.exit.IsZero() {
		return 0
	}

	return node.exit.Sub(node.enter)
}

// Enter starts measuring node.
func (node *Node) Enter() {
	node.enter = time.Now()
}

// Exit stops measuring node.
func (node *Node) Exit() {
	node.exit = time.Now()
}

// MarshalJSON implements json.Marshaler interface
// Just return duration as string.
func (node Node) MarshalJSON() ([]byte, error) {
	return []byte(fmt.Sprintf("%q", node.Duration())), nil
}
