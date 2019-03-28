package session

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/boomfunc/root/ci/git"
	"github.com/boomfunc/root/ci/graph"
	"github.com/boomfunc/root/ci/tools"
	"github.com/boomfunc/root/tools/flow"
	"github.com/google/uuid"
)

type Session struct {
	UUID   uuid.UUID
	Origin string
	Ref    string
	// repo   *git.Repository
	// step flow.Step
}

// New returns new static session definition
func New(origin, ref string) (*Session, error) {
	session := &Session{
		Origin: origin,
		Ref:    ref,
		UUID:   uuid.New(),
	}

	return session, nil
}

// logger returns writer for log session lifecycle
func (session *Session) logger() (io.WriteCloser, error) {
	// get abs path for log file
	path := tools.SessionLogPath(session.UUID.String())

	// check directory exists, otherwise create it
	dir := filepath.Dir(path)
	if _, err := os.Stat(dir); err != nil {
		if os.IsNotExist(err) {
			// not exists -> create dir
			if err := os.MkdirAll(dir, os.ModePerm); err != nil {
				return nil, err
			}
		} else {
			// some unexpected error from stat
			return nil, err
		}
	}

	// directory exists - create file
	f, err := os.Create(path)
	if err != nil {
		// error while creating file
		return nil, err
	}

	return f, nil
}

// Run implements flow.Step interface
// Run is main entrypoint.
// Runs all steps with the same context (mixed)
// here context creates and cancels if something wrong
func (session *Session) Run(ctx context.Context) (err error) {
	// clone repository to `path`
	path := tools.RepoPath(session.UUID.String())
	repo, err := git.Clone(session.Origin, session.Ref, path)
	if err != nil {
		return
	}
	// session.repo = repo

	// garbage repository anyway
	defer repo.Destroy()

	// create flow graph
	graph, err := graph.New(repo.Path)
	if err != nil {
		return
	}
	// session.step = graph

	// get diff of last repo commit
	// if we cannot calculate diff what to build - no need to continue session runnning
	paths, err := repo.Diff()
	if err != nil {
		return
	}

	// fill context from current level
	// fill all we can to low level steps
	ctx = context.WithValue(ctx, "session", session.UUID.String())
	ctx = context.WithValue(ctx, "origin", session.Origin)
	ctx = context.WithValue(ctx, "diff", paths)

	// run the whole flow
	err = flow.ExecuteWithContext(ctx, graph)
	return
}

// MarshalJSON implements json.Marshaler interface
// because we need dynamic fields not declared on structure
func (session Session) MarshalJSON() ([]byte, error) {
	type Alias Session // to prevent infinity loop

	return json.Marshal(&struct {
		Graph string // graph endpoint
		Log   string // log endpoint
		Alias
	}{
		// TODO: paths from router dynamically
		Graph: fmt.Sprintf("/sessions/%s/graph", session.UUID),
		Log:   fmt.Sprintf("/sessions/%s/log", session.UUID),
		Alias: Alias(session),
	})
}
