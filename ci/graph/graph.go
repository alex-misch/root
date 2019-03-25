package graph

import (
	"context"
	"errors"
	"os"
	"path/filepath"

	"github.com/boomfunc/root/tools/flow"
	"github.com/boomfunc/root/tools/log"
)

var (
	ErrWrongDiff = errors.New("ci/graph: Provided `diff` is invalid")
	ErrNotDir    = errors.New("ci/graph: Provided `root` is not directory")
)

type Graph struct {
	root  string // same as git repo root
	nodes map[string]*Node
	edges map[string][]*Node
	ctxs  map[flow.Step]context.Context
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
		ctxs:  make(map[flow.Step]context.Context),
	}

	// fill the graph
	if err := filepath.Walk(graph.root, graph.walk); err != nil {
		// walk throw fs tree failed
		return nil, err
	}

	// graph ready, link edges
	graph.Link()

	return graph, nil
}

// roots returns all packages in fsgraph (relative to root)
// must be invoked after .Link()
func (graph *Graph) roots() []string {
	all := make([]string, len(graph.nodes))

	i := 0
	for k := range graph.nodes {
		all[i] = k
		i++
	}

	return all
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
			// TODO: some dynamic config variants (json, yaml, etc) semaphore
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

// Link binds all nodes together by their config definition
func (graph *Graph) Link() {
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

// addCtx create child step's context from parent and save it to collection
// collection will be passed to parent context for future using
func (graph *Graph) addCtx(ctx context.Context, step flow.Step, pack, name string) {
	// WithValue returns copy of ctx
	ctx = context.WithValue(ctx, "pack", pack)
	ctx = context.WithValue(ctx, "name", name)

	// save to collection
	graph.ctxs[step] = ctx
}

// changes returns list of direct nodes changed and indirect nodes changed
// by direct node's roots
func (graph *Graph) changes(ctx context.Context, roots []string) (direct []*Node, indirect []*Node) {
	for _, root := range roots {
		if node, ok := graph.nodes[root]; ok {
			// create copy of context for this job
			for name, job := range node.Jobs {
				graph.addCtx(ctx, job, root, name)
			}
			// append to output tree
			direct = append(direct, node)

			// calculate nodes, depends on drect changed (indirect)
			// add deps to indirect
			for _, inode := range graph.edges[root] {
				// create copy of context for this job
				for name, job := range inode.Jobs {
					graph.addCtx(ctx, job, root, name)
				}
				// append to output tree
				indirect = append(indirect, inode)
			}
		}
	}

	return
}

// steps return total tree (mixed) of flow.Step
// built by analyzing changed paths and their belonging to the nodes
func (graph *Graph) steps(direct []*Node, indirect []*Node) flow.Step {
	// total steps for resolving all tree's flow
	total := make([]flow.Step, 0)

	// TODO DRY code? No, have not heard
	// Phase 1. Indirect jobs. Check referencing dependencies works
	// iterate each node and collect steps
	indirects := make([]flow.Step, 0)
	for _, node := range indirect {
		// check steps exists
		// may return nil, job or another step (for example group or parallel)
		if step := node.steps(node.Indirect); step != nil {
			indirects = append(indirects, step)
		}
	}
	if step := flow.Concurrent(indirects...); step != nil {
		total = append(total, step)
	}

	// Phase 2. Direct jobs. Nodes that was changed directly
	// iterate each node and collect steps
	directs := make([]flow.Step, 0)
	for _, node := range direct {
		// check steps exists
		// may return nil, job or another step (for example group or parallel)
		if step := node.steps(node.Direct); step != nil {
			directs = append(directs, step)
		}
	}
	if step := flow.Concurrent(directs...); step != nil {
		total = append(total, step)
	}
	// TODO end of DRY code

	// return total flow
	return flow.Group(total...)
}

// Run implements Step interface
// run mixed nested flow.Step interface
func (graph *Graph) Run(ctx context.Context) error {
	// Phase 1. Get graph `raw` changes (get diff)
	diff, ok := ctx.Value("diff").([]string)
	if !ok {
		return ErrWrongDiff
	}

	// Phase 2. Get changed nodes
	// Get direct and indirect nodes changed by changed paths
	direct, indirect := graph.changes(
		ctx, // provide parent context from which copies will be created for child steps
		// Get direct changed node's root by provided path
		roots(
			diff,          // `raw` changes paths
			graph.roots(), // all graph node roots
		),
	)

	// Phase 3. Fill ctx by subcontexts for all nested steps
	ctx = context.WithValue(ctx, "ctxs", graph.ctxs)

	// Phase 4.
	// get final flow.Step for perform
	// and go deeper into running
	steps := graph.steps(direct, indirect)
	log.Debugf("Flow to perform:\n%s", steps)

	return flow.ExecuteWithContext(ctx, steps)
}
