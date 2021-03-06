package git

import (
	"errors"
	"fmt"
	"os"

	gogit "gopkg.in/src-d/go-git.v4"
	"gopkg.in/src-d/go-git.v4/plumbing"
)

var (
	ErrWrongClonePath = errors.New("ci/git: Wrong cloning path")
)

type Repository struct {
	Path   string
	Origin string
	gogit.Repository
}

func Clone(origin, ref, path string) (*Repository, error) {
	// path may be empty
	if path == "" {
		return nil, ErrWrongClonePath
	}

	// calculate clone options
	// here will be resolved https://github.com/boomfunc/root/issues/17
	cloneOpts := &gogit.CloneOptions{
		URL:           origin,
		ReferenceName: plumbing.ReferenceName(ref),
		SingleBranch:  true,
		Depth:         2, // TODO dynamic
	}

	// clone last n commits
	repo, err := gogit.PlainClone(path, false, cloneOpts)
	if err != nil {
		return nil, fmt.Errorf("ci/git: %s", err)
	}

	return &Repository{path, origin, *repo}, nil
}

func (repo *Repository) Destroy() error {
	return os.RemoveAll(repo.Path)
}

// Diff returns a list of filenames changed (added, modified, deleted) by a reference apply
func (repo *Repository) Diff() ([]string, error) {
	// get current commit of cloned reference
	ref, err := repo.Head()
	if err != nil {
		return nil, fmt.Errorf("ci/git: %s", err)
	}

	current, err := repo.CommitObject(ref.Hash())
	if err != nil {
		return nil, fmt.Errorf("ci/git: %s", err)
	}

	// get diff
	stats, err := current.Stats()
	if err != nil {
		return nil, fmt.Errorf("ci/git: %s", err)
	}

	paths := make([]string, len(stats))
	for i, fstat := range stats {
		paths[i] = fstat.Name
	}

	return paths, nil
}
