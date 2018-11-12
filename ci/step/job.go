package step

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"reflect"
	"sync"

	"github.com/boomfunc/root/ci/docker"
)

var (
	ErrJobOrphan = errors.New("Job does not have an environment property during run")
)

// JobEnvironment describes the environment in which the job is running
// used for generating unique name for container and for store keys
type JobEnvironment struct {
	session string // unique session uuid
	repo    string // repository origin `github.com/boomfunc/root`
	pack    string // package name relative to session root `base/tools`
	name    string // job name (`test`, `build`, `deploy`)
}

func (env *JobEnvironment) SrcPath() string {
	return filepath.Join(
		"/bmpci",
		"src",
		Sum(env.repo),
		// TODO: workdir subdir
	)
}

// deps: session(repo), package, job
// /bmpci/artifact/$sha(repo + package)/$job
func (env *JobEnvironment) ArtifactPath() string {
	return filepath.Join(
		"/bmpci",
		"artifact",
		env.session,
		Sum(env.repo, env.pack),
		env.name,
	)
}

// deps: repo, package, job
// /bmpci/cache/$sha(repo + package)/$job
func (env *JobEnvironment) CachePath() string {
	return filepath.Join(
		"/bmpci",
		"cache",
		Sum(env.repo, env.pack),
		env.name,
	)
}

// JobMount is special struct describes which dirs we will mount to docker image
// if value empty - omit mounting
type JobMount struct {
	SrcPath      string `yaml:"src,omitempty"`
	ArtifactPath string `yaml:"artifact,omitempty"`
	CachePath    string `yaml:"cache,omitempty"`
}

// Entries returns array of (from, to) strings for each mount part
func (m JobMount) Entries(env *JobEnvironment) [][]string {
	// TODO: move to struct. Now: slices in format []string{hostPath, containerPath}
	entries := make([][]string, 0)

	// does we need to mount source code?
	if m.SrcPath != "" {
		entries = append(entries, []string{env.SrcPath(), m.SrcPath})
	}

	// does we need to mount artifacts?
	if m.ArtifactPath != "" {
		entries = append(entries, []string{env.ArtifactPath(), m.ArtifactPath})
	}

	// does we need to mount caches?
	if m.CachePath != "" {
		entries = append(entries, []string{env.CachePath(), m.CachePath})
	}

	return entries
}

// Job is basic Step type
// docker container which receive their workdir as `src` and generate (or not) artifacts
// .Run() is thread safety, because some separate Jobs should be able to refer same another Job (duplicat case)
type Job struct {
	Mount JobMount `yaml:"mount,omitempty,flow"`

	Workdir    string `yaml:"workdir,omitempty"`    // path to directory to mount as `src`
	Docker     string `yaml:"docker,omitempty"`     // docker image to use
	Entrypoint string `yaml:"entrypoint,omitempty"` // command to run (overrides docker ENTRYPOINT)

	once sync.Once      // used for running only one instance of docker container of similar jobs per all flow
	wg   sync.WaitGroup // used for waiting another similar jobs completion of the original job (first runned)
}

// NewJob returns single step for docker running
func NewJob(workdir, docker, entrypoint string) Interface {
	return &Job{
		Workdir:    workdir,
		Docker:     docker,
		Entrypoint: entrypoint,
	}
}

// run runs single docker container
// with provided src and destination dirs as volumes
func (job *Job) run(ctx context.Context) error {
	// take the environment in which the job starts
	// context must contains project and repo for generating key
	// use this key for docker container name, getting cache and artifacts from store
	// TODO
	env := &JobEnvironment{
		session: "51eee42f-6c60-4470-89c9-9879276bcb8e",
		repo:    "https://github.com/agurinov/root",
		pack:    "ci",
		name:    "build",
	}
	// env, ok := ctx.Value("environment").(*JobEnvironment)
	// if !ok {
	// 	return ErrJobOrphan
	// }

	// TODO: meybe check env? somethink like .validate()

	// prepare all docker volumes (src, artifact, cache)
	mounts := job.Mount.Entries(env)
	fmt.Println("MOUNTS:", mounts)

	if true {
		return errors.New("INTERMEDIATE")
	}

	image, err := docker.GetImage(job.Docker)
	if err != nil {
		return err
	}

	// TODO: workdir relative to graph root (session root or repo root) -> from env
	return docker.RunContainer(image, job.Entrypoint, job.Workdir)
}

// Run implements Step interface
// run docker container with provided options
func (job *Job) Run(ctx context.Context) error {
	// run only one instance of similar jobs per all session
	// with eaiting of similar jobs
	var err error

	job.once.Do(func() {
		job.wg.Add(1)
		err = job.run(ctx)
		job.wg.Done()
	})
	job.wg.Wait()

	return err
}

// String implements fmt.Stringer interface
func (job *Job) String() string {
	return fmt.Sprintf("JOB(%s, ID=%d)", job.Entrypoint, reflect.ValueOf(job).Pointer())
}
