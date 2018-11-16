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
	repo, err := git.GetRepo(origin, tools.RepoPath(origin))
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

// Run implements ste.Interface. Run is main entrypoint.
// Runs all steps with the same context (mixed)
// here context creates and cancels if something wrong
func (session *Session) Run(ctx context.Context) error {
	// garbage anyway
	defer session.repo.Destroy()

	// get diff of last repo commit
	// if we cannot calculate diff what to build - no need to continue session runnning
	paths, err := session.repo.Diff()
	if err != nil {
		return err
	}

	// fill context from current level
	// fill all we can to low level steps
	ctx = context.WithValue(ctx, "session", session.UUID.String())
	ctx = context.WithValue(ctx, "origin", session.repo.Origin)
	ctx = context.WithValue(ctx, "diff", paths)

	// run the whole flow
	return session.step.Run(ctx)
}
