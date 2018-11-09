package types

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"sync"

	"github.com/boomfunc/root/ci/docker"
)

var (
	ErrNoEnv = errors.New("Environment not provided in context")
)

// JobOptions describes what docker environment job must be performed in.
// type JobOptions struct {
// 	Context    string // path to directory to mount as `src`
// 	Docker     string // docker image to use
// 	Entrypoint string // command to run (overrides docker ENTRYPOINT)
// }

// JobEnvironment describes the environment in which the job is running
// used for generating unique name for container and for store keys
type JobEnvironment struct {
	Repo string
	Pack string
	Name string
	// NOTE: idea of keys:
	// github.com/boomfunc/root:ci/some/package:job1

	// github.com/boomfunc/root - session init, graph root
	// ci/some/package - graph node root, relative to session root
	// job1 - job name in flow
}

// ID returns unique scope identifier
func (env *JobEnvironment) ID() string {
	return fmt.Sprintf("%s-%s-%s", env.Repo, env.Pack, env.Name)
}

// Job is basic Step type
// docker container which receive their workdir as `src` and generate (or not) artifacts
// TODO: must be thread safety, because some separate Jobs should be able to refer same another Job (duplicat case)
type Job struct {
	env *JobEnvironment

	Workdir    string         `yaml:"workdir,omitempty"`    // path to directory to mount as `src`
	Docker     string         `yaml:"docker,omitempty"`     // docker image to use
	Entrypoint string         `yaml:"entrypoint,omitempty"` // command to run (overrides docker ENTRYPOINT)
	once       sync.Once      // used for running only one instance of docker container of similar jobs per all flow
	wg         sync.WaitGroup // used for waiting another similar jobs completion of the original job (first runned)
}

// NewJob returns single step for docker running
func NewJob(workdir, docker, entrypoint string) Step {
	return &Job{
		Workdir:    workdir,
		Docker:     docker,
		Entrypoint: entrypoint,
	}
}

// run runs single docker container
// with provided src and destination dirs as volumes
func (job *Job) run() {
	// prepare all docker volumes (src, artifact, cache)
	// src is mounted
	// cache is mounted
	// artifact is mounted, but empty dir
	fmt.Printf("job.RUN(): DOCKER CONTAINER: %s\n", job.String())
	image, err := docker.GetImage(job.Docker)
	if err != nil {
		fmt.Println("IMAGE ERROR:", err)
	}

	// fmt.Printf("job.RUN(): Image: %s\n", image)
	err = docker.RunContainer(image, job.Entrypoint, job.Workdir)
	if err != nil {
		fmt.Println("CONTAINER RUN ERROR:", err)
	}
}

// Run implements Step interface
// run docker container with provided options
func (job *Job) Run(ctx context.Context) error {
	// take the environment in which the job starts
	// context must contains project and repo for generating key
	// use this key for docker container name, getting cache and artifacts from store
	// if job.env == nil {
	// 	return ErrNoEnv
	// }
	// environment, ok := ctx.Value("environment").(*JobEnvironment)
	// if !ok {
	// 	return ErrNoEnv
	// }

	// generate unique key
	// id := job.env.ID()
	// fmt.Printf("job.ID: %s\n", id)

	// get artifact and cache paths by `id` for docker volume
	// TODO

	// run only one instance of similar jobs per all session
	// with eaiting of similar jobs
	// TODO errors will not visible -> flow does not stop
	job.once.Do(func() {
		job.wg.Add(1)
		job.run()
		job.wg.Done()
	})
	job.wg.Wait()

	return nil
}

// SetEnvironment set environment (repo, project, node) in which context job will run
func (job *Job) SetEnvironment(repo, pack, name string) {
	job.env = &JobEnvironment{
		Repo: repo,
		Pack: pack,
		Name: name,
	}
}

// String implements fmt.Stringer interface
func (job *Job) String() string {
	return fmt.Sprintf("JOB(%s, ID=%d)", job.Entrypoint, reflect.ValueOf(job).Pointer())
}
