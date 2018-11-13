package ci

import (
	"context"

	"github.com/boomfunc/root/ci/git"
	"github.com/boomfunc/root/ci/graph"
	"github.com/boomfunc/root/ci/step"
	"github.com/boomfunc/root/ci/tools"
	"github.com/google/uuid"
)

type Session struct {
	UUID uuid.UUID
	repo *git.Repository
	step step.Interface
}

// repo: github.com/boomfunc/root - what we clonning what is
func NewSession(origin string) (*Session, error) {
	// clone repository to `path`
	repo, err := git.GetRepo(origin, tools.SrcPath(origin))
	if err != nil {
		return nil, err
	}

	// garbage if repo exists
	defer func() {
		if err != nil {
			repo.Destroy()
		}
	}()

	// create flow graph
	graph, err := graph.New(repo.Path)
	if err != nil {
		return nil, err
	}

	session := &Session{
		UUID: uuid.New(),
		repo: repo,
		step: graph,
	}

	return session, nil
}

// Run is main entrypoint. Runs all steps with the same context
// here context creates and cancels if something wrong
func (session *Session) Run() error {
	// garbage anyway
	defer func() {
		session.repo.Destroy()
	}()

	// Phase 1. Create context with cancel functionality
	// and proxy information about high level modules to low level
	// integration purpose
	// because each level does not know the context in which it is running
	ctx, cancel := context.WithCancel(context.Background())
	// fill from current level
	ctx = context.WithValue(ctx, "session", session.UUID.String())
	ctx = context.WithValue(ctx, "repo", tools.Sum(session.repo.Origin))
	// always cancel the context on return (in error case they will cancel any job)
	defer cancel()

	// get diff of last repo commit
	paths, err := session.repo.Diff()
	if err != nil {
		return err
	}
	// also provide diff to graph
	ctx = context.WithValue(ctx, "diff", paths)

	// run the whole flow
	return session.step.Run(ctx)
}
