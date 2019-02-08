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

func GetRepo(origin, path, ref string) (*Repository, error) {
	cloneOpts := &gogit.CloneOptions{
		URL:           origin,
		ReferenceName: plumbing.ReferenceName(ref),
		SingleBranch:  true,
		Depth:         2, // TODO dynamic
	}

	if path == "" {
		return nil, ErrWrongClonePath
	}

	if _, err := os.Stat(path); !os.IsNotExist(err) {
		// exists -> delete folder
		if err := os.RemoveAll(path); err != nil {
			return nil, fmt.Errorf("ci/git: %s", err)
		}
	}
	// not exists -> create dir
	if err := os.MkdirAll(path, os.ModePerm); err != nil {
		return nil, fmt.Errorf("ci/git: %s", err)
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

func (repo *Repository) Diff() ([]string, error) {
	// get current commit
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
