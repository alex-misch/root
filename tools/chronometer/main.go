package chronometer

import (
	"fmt"
	"sort"
	"strings"
	"time"
)

type Chronometer map[string]*Node

func New() Chronometer {
	return make(map[string]*Node, 0)
}

// Enter starts measuring node.
// As the `enter` time current value will be used.
func (ch Chronometer) Enter(name string) {
	ch[name] = NewNode()
}

// Exit stops measuring node.
// As the `exit` time current value will be used.
func (ch Chronometer) Exit(name string) {
	if node, ok := ch[name]; ok {
		node.Exit()
	}
}

// EnterWithTime starts measuring node.
// As the `enter` time provided value will be used.
func (ch Chronometer) EnterWithTime(name string, t time.Time) {
	ch[name] = &Node{enter: t}
}

// ExitWithTime stops measuring node.
// As the `exit` time provided value will be used.
func (ch Chronometer) ExitWithTime(name string, t time.Time) {
	if node, ok := ch[name]; ok {
		node.exit = t
	}
}

// AddNode adds node created outside .Enter() to chronometer collection
func (ch Chronometer) AddNode(name string, node *Node) {
	ch[name] = node
}

func (ch Chronometer) String() string {
	nodes := []string{}

	for name, node := range ch {
		d := node.Duration()
		if d != 0 {
			nodes = append(nodes, fmt.Sprintf("%s: %s", name, d))
		}
	}

	sort.Strings(nodes)
	return strings.Join(nodes, ", ")
}
