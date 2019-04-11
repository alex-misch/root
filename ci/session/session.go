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
func New(id uuid.UUID, origin, ref string) (*Session, error) {
	// Pre phase. check UUID is really provided
	if id == uuid.Nil {
		id = uuid.New()
	}

	// Phase 1
	// create empty session
	session := &Session{
		UUID:   id,
		Origin: origin,
		Ref:    ref,
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
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
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
	// Phase 1. Log session execution
	logger, err := session.logger()
	if err != nil {
		return
	}
	defer logger.Close()

	fmt.Fprintln(logger, "Session started")
	defer fmt.Fprintf(logger, "Session finished with error: %v", err)

	// clone repository to `path`
	path := tools.RepoPath(session.UUID.String())
	fmt.Fprintf(logger, "Cloning repository to: %s\n", path)
	repo, err := git.Clone(session.Origin, session.Ref, path)
	if err != nil {
		fmt.Println("git.Clone:", err)
		return err
	}
	// session.repo = repo
	fmt.Fprintln(logger, "Repository cloned")

	// garbage repository anyway
	defer func() {
		fmt.Fprintln(logger, "Repository destroying...")
		derr := repo.Destroy()
		fmt.Fprintf(logger, "Repository destroyed with error: %v\n", derr)
	}()

	// create flow graph
	fmt.Fprintln(logger, "Graph initializing and linking...")
	graph, err := graph.New(session.UUID, repo.Path)
	if err != nil {
		return
	}
	// session.step = graph
	fmt.Fprintln(logger, "Graph initialized and linked")

	// get diff of last repo commit
	// if we cannot calculate diff what to build - no need to continue session runnning
	paths, err := repo.Diff()
	if err != nil {
		return
	}
	fmt.Fprintf(logger, "Repository diff calculated: %v\n", paths)

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
	type alias Session // to prevent infinity loop

	return json.Marshal(&struct {
		Graph string // graph endpoint
		Log   string // log endpoint
		alias
	}{
		// TODO: paths from router dynamically
		Graph: fmt.Sprintf("http://playground.lo:8080/sessions/%s/graph", session.UUID),
		Log:   fmt.Sprintf("http://playground.lo:8080/sessions/%s/log", session.UUID),
		alias: alias(session),
	})
}
