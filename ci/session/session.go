package session

import (
	"context"

	"github.com/boomfunc/root/ci/git"
	"github.com/boomfunc/root/ci/graph"
	"github.com/boomfunc/root/ci/tools"
	"github.com/boomfunc/root/tools/flow"
	"github.com/google/uuid"
)

type Session struct {
	UUID   uuid.UUID
	origin string
	ref    string
	repo   *git.Repository
	step   flow.Step
}

// New returns new static session definition
func New(origin, ref string) (*Session, error) {
	session := &Session{
		origin: origin,
		ref:    ref,
		UUID:   uuid.New(),
	}

	return session, nil
}

// Run implements flow.Step interface
// Run is main entrypoint.
// Runs all steps with the same context (mixed)
// here context creates and cancels if something wrong
func (session *Session) Run(ctx context.Context) error {
	// clone repository to `path`
	repo, err := git.GetRepo(session.origin, tools.RepoPath(session.origin), session.ref)
	if err != nil {
		return err
	}
	session.repo = repo

	// garbage repository anyway
	defer session.repo.Destroy()

	// create flow graph
	graph, err := graph.New(repo.Path)
	if err != nil {
		return err
	}
	session.step = graph

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
	return flow.ExecuteWithContext(ctx, session.step)
}
