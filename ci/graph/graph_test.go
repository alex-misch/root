package graph

// import (
// 	"context"
// 	"testing"
//
// 	"github.com/boomfunc/root/ci/types"
// )
//
// func TestSteps(t *testing.T) {
// 	// graph, err := New("/go/src/github.com/boomfunc/root//ci///playground////")
// 	// graph, err := New("/go/src/github.com/boomfunc/root/ci/playground")
// 	// graph, err := New("playground")
// 	graph, err := New("./playground")
//
// 	if err != nil {
// 		t.Fatal(err)
// 	}
//
// 	// t.Log(graph.nodes)
// 	// t.Log(graph.edges)
//
// 	steps := graph.Steps(
// 		".fer",
// 		"sub1/lolkek",
// 		"foo/frmejkl/.fer/",
// 		"sub1/sub2/sub3//dir/lolkkek",
// 	)
//
// 	// t.Log("STEPS:", steps)
//
// 	environment := &types.JobEnvironment{
// 		Repo: "root",
// 		Pack: "p1",
// 		Name: "test",
// 	}
//
// 	// generate context with global cancelling and environment
// 	ctx, cancel := context.WithCancel(context.Background())
// 	ctx = context.WithValue(ctx, "environment", environment)
// 	defer cancel()
//
// 	// run the flow
// 	if err := steps.Run(ctx); err != nil {
// 		t.Fatal(err)
// 	}
// }
