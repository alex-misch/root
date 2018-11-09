package ci

import (
	"context"
	// "fmt"

	"github.com/boomfunc/root/ci/git"
	"github.com/boomfunc/root/ci/graph"
	"github.com/google/uuid"
)

type Session struct {
	Uuid uuid.UUID
	repo *git.Repository
	flow Flow // layer from which we get steps to perform
}

// repo: github.com/boomfunc/root - what we clonning what is
// TODO: undo functions (repo delete) if some errors
func NewSession(origin string) (*Session, error) {
	// clone repository to `path`
	repo, err := git.GetRepo(origin)
	if err != nil {
		return nil, err
	}

	// create flow graph
	graph, err := graph.New(repo.Path)
	if err != nil {
		return nil, err
	}

	// // create docker client to host
	// client, err := docker.NewClientWithOpts(docker.WithVersion("1.38"))
	// if err != nil {
	// 	return nil, err
	// }

	session := &Session{
		Uuid: uuid.New(),
		repo: repo,
		flow: graph,
	}

	return session, nil
}

// Root returns path where repo root based (or graph root)
// func (session *Session) Root() string {
// 	return session.
// }

// Run is main entrypoint. Runs all steps with the same context
// here context creates and cancels if something wrong
func (session *Session) Run() error {
	// get diff of last repo commit
	paths, err := git.RepoDiff(session.repo)
	if err != nil {
		return err
	}

	// create context with cancel functionality
	ctx, cancel := context.WithCancel(context.Background())
	// TODO
	// ctx = context.WithValue(ctx, "environment", environment)
	// always cancel the context on return (in error case they will cancel any job)
	defer cancel()

	// run the flow
	flow := session.flow.Steps(paths...)
	// fmt.Printf("FLOW TO PERFORM:\n%s\n", flow)

	return flow.Run(ctx)
}
