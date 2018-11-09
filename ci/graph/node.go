package graph

import (
	"io"
	"os"

	"github.com/boomfunc/root/ci/step"
	"gopkg.in/yaml.v2"
)

const (
	ConfigName = "foobar"
)

type Node struct {
	Jobs     map[string]*step.Job `yaml:"jobs,omitempty"`
	Deps     []string             `yaml:"deps,omitempty"`
	Indirect []string             `yaml:"indirect,omitempty"`
	Direct   []string             `yaml:"direct,omitempty"`
}

func loadYAML(r io.Reader) (*Node, error) {
	// Try to read raw yaml
	decoder := yaml.NewDecoder(r)
	decoder.SetStrict(false)

	var node Node
	if err := decoder.Decode(&node); err != nil {
		return nil, err
	}

	return &node, nil
}

// NodeFromLocalFile loads YAML config from local file system by name
func NodeFromLocalFile(name string) (*Node, error) {
	// try to open file and get io.Reader
	f, err := os.Open(name)
	if err != nil {
		return nil, err
	}

	// parse yaml
	return loadYAML(f)
}

// steps returns Step slice by their names from collection
// in `names` order
func (node *Node) steps(names []string) step.Interface {
	steps := make([]step.Interface, 0)

	for _, name := range names {
		// try to get job from collections
		if job, ok := node.Jobs[name]; ok {
			// job exists -> add
			steps = append(steps, job)
		}
	}

	return step.NewGroup(steps...)
}
