package graph

import (
	"context"
	"errors"
	"os"
	"path/filepath"

	"github.com/boomfunc/root/ci/step"
)

var (
	ErrWrongDiff = errors.New("graph: Provided `diff` is invalid")
	ErrNotDir    = errors.New("graph: Provided `root` is not directory")
)

type Graph struct {
	root  string // same as git repo root
	nodes map[string]*Node
	edges map[string][]*Node
}

// New creates new filesystem graph, based in root path
// synonym to git repo and session repo
func New(root string) (*Graph, error) {
	// Pre phase. Prepare graph root
	// TODO document this important key concept
	root = filepath.Clean(root)

	// Phase 1. Check root is directory
	info, err := os.Stat(root)
	switch {
	case err != nil:
		return nil, err
	case !info.Mode().IsDir():
		return nil, ErrNotDir
	}

	// Phase 2
	// create empty graph
	graph := &Graph{
		root:  root,
		nodes: make(map[string]*Node),
		edges: make(map[string][]*Node),
	}

	// fill the graph
	if err := filepath.Walk(graph.root, graph.walk); err != nil {
		// walk throw fs tree failed
		return nil, err
	}

	// graph ready, link edges
	graph.LinkNodes()

	return graph, nil
}

func (graph *Graph) walk(path string, info os.FileInfo, err error) error {
	// proxy parent error
	if err != nil {
		return err
	}

	// calculate path's root for using as key
	// root is relative to graph.root
	// Example:
	// path == /bmpci/repos/e443156edcb4f6431d71fc14c586dabe47bb858a19b2b31a598eeadbef8cf45f/bmpjs/bmp-router/src/styles
	// graph.root == /bmpci/repos/e443156edcb4f6431d71fc14c586dabe47bb858a19b2b31a598eeadbef8cf45f
	// root will be 'bmpjs/bmp-router/src/styles'
	// NOTE: calls Clean on the result. Perfect!
	root, err := filepath.Rel(graph.root, path)
	if err != nil {
		return err
	}

	// check each element for "ci package" compliance
	// check for realpath (based on graph.root)
	// `root` previously obtained used only for keys in graph to be relative to root
	if info.Mode().IsDir() {
		config := filepath.Join(path, ConfigName)
		// check config file
		if info, err := os.Stat(config); err == nil && info.Mode().IsRegular() {

			// try to get node struct from file config
			// TODO: some dynamic config variants (json, yaml, etc)
			node, err := NodeFromLocalFile(config)
			if err != nil {
				return err
			}

			// assign node to graph with `root` as key
			graph.SetNode(root, node)
		}
	}

	return nil
}

// SetNode adds a new node into the game
func (graph *Graph) SetNode(root string, node *Node) {
	graph.nodes[root] = node
}

// SetEdge adds a new reverse(!) link between nodes into the game
// reverse because it is semantic specific feature for search improvements
func (graph *Graph) SetEdge(root string, node *Node) {
	graph.edges[root] = append(graph.edges[root], node)
}

// LinkNodes binds all nodes together by their config definition
func (graph *Graph) LinkNodes() {
	for _, node := range graph.nodes {
		for _, dep := range node.Deps {
			// calculate dep with root
			// TODO also key concept -> document
			// NOTE: why? dep = filepath.Join(graph.root, dep)
			if _, ok := graph.nodes[dep]; ok {
				// destination node found, reverse dependency
				graph.SetEdge(dep, node)
			}
		}
	}
}

func (graph *Graph) changedNodes(roots []string) (direct []*Node, indirect []*Node) {
	for _, root := range roots {
		if node, ok := graph.nodes[root]; ok {
			direct = append(direct, node)
			// add deps to indirect
			for _, inode := range graph.edges[root] {
				indirect = append(indirect, inode)
			}
		}
	}

	return
}

func (graph *Graph) jobs(direct []*Node, indirect []*Node) step.Interface {
	// total steps for resolving all tree's flow
	total := make([]step.Interface, 0)

	// TODO DRY code? No, have not heard
	// Phase 1. Indirect jobs. Check referencing dependencies works
	// iterate each node and collect steps
	indirects := make([]step.Interface, 0)
	for _, node := range indirect {
		// check steps exists
		// may return nil, job or another step (for example group or parallel)
		if step := node.steps(node.Indirect); step != nil {
			indirects = append(indirects, step)
		}
	}
	if step := step.NewParallel(indirects...); step != nil {
		total = append(total, step)
	}

	// Phase 2. Direct jobs. Nodes that was changed directly
	// iterate each node and collect steps
	directs := make([]step.Interface, 0)
	for _, node := range direct {
		// check steps exists
		// may return nil, job or another step (for example group or parallel)
		if step := node.steps(node.Direct); step != nil {
			directs = append(directs, step)
		}
	}
	if step := step.NewParallel(directs...); step != nil {
		total = append(total, step)
	}
	// TODO end of DRY code

	// return total flow
	return step.NewGroup(total...)
}

func (graph *Graph) Run(ctx context.Context) error {
	// get global env
	env, ok := ctx.Value("env").(map[string]interface{})
	if !ok {
		return step.ErrStepOrphan
	}

	// get diff
	diff, ok := env["diff"].([]string)
	if !ok {
		return ErrWrongDiff
	}

	// fill the context by current possibilities
	// TODO: what?

	// go deeper into running
	return graph.step(diff...).Run(ctx)
}

func (graph *Graph) step(paths ...string) step.Interface {
	// Phase 1. get all graph node roots
	all := make([]string, len(graph.nodes))
	i := 0
	for k := range graph.nodes {
		all[i] = k
		i++
	}

	// Phase 2. convert incoming path to be relative in graph root
	// for i, path := range paths {
	// 	paths[i] = toRelPath(graph.root, path)
	// }

	// Phase 3. Get direct changed node's root by provided path
	roots := roots(paths, all)

	// get direct and indirect nodes
	direct, indirect := graph.changedNodes(roots)

	// get jobs
	return graph.jobs(direct, indirect)
}
