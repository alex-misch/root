package step

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"reflect"
	"sync"

	"github.com/boomfunc/root/ci/docker"
	"github.com/boomfunc/root/ci/tools"
)

var (
	ErrStepOrphan = errors.New("step: Step run without required context")
)

// JobEnvironment describes the environment in which the job is running
// used for generating unique name for container and for store keys
type JobEnvironment struct {
	session string // unique session uuid
	origin  string // repository origin `github.com/boomfunc/root`
	pack    string // package name relative to session root `base/tools`
	name    string // job name (`test`, `build`, `deploy`)
}

func NewEnv(session, origin, pack, name string) *JobEnvironment {
	return &JobEnvironment{session, origin, pack, name}
}

func (env *JobEnvironment) SrcPath(workdir string) string {
	return filepath.Join(
		tools.SrcPath(env.origin),
		workdir,
	)
}

// deps: session(repo), package, job
// /bmpci/artifact/$sha(repo + package)/$job
func (env *JobEnvironment) ArtifactPath() string {
	return filepath.Join(
		"/bmpci",
		"artifact",
		env.session,
		tools.Sum(env.origin, env.pack),
		env.name,
	)
}

// deps: repo, package, job
// /bmpci/cache/$sha(repo + package)/$job
func (env *JobEnvironment) CachePath() string {
	return filepath.Join(
		"/bmpci",
		"cache",
		tools.Sum(env.origin, env.pack),
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
func (m JobMount) Entries(workdir string, env *JobEnvironment) [][]string {
	// TODO: move to struct. Now: slices in format []string{hostPath, containerPath}
	entries := make([][]string, 0)

	// does we need to mount source code?
	if m.SrcPath != "" {
		entries = append(entries, []string{env.SrcPath(workdir), m.SrcPath})
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
func (step *Job) run(ctx context.Context) error {
	var session, origin, pack, name string

	// get required attributes from context and check it
	session = ctx.Value("session").(string)
	origin = ctx.Value("origin").(string)
	pack = ctx.Value("pack").(string)
	name = ctx.Value("name").(string)

	if session == "" || origin == "" || pack == "" || name == "" {
		return ErrStepOrphan
	}

	// get image id for container
	image, err := docker.GetImage(ctx, step.Docker)
	if err != nil {
		return err
	}

	// TODO: defer ImageRemove()

	// Create and run container
	return docker.RunContainer(
		ctx,                                        // context for cancellation
		image, step.Entrypoint, step.Mount.SrcPath, // basic data for docker
		// calculate environment in which the job starts
		// use this env for docker container name, getting cache and artifacts volumes path
		step.Mount.Entries(step.Workdir, NewEnv(session, origin, pack, name)), // get mount paths
	)
}

// Run implements Step interface
// run docker container with provided options
func (step *Job) Run(ctx context.Context) error {
	// error visibility of inner once.Do invoke
	var err error

	// actualize context for this step
	ctx = CtxFromCtx(ctx, step)

	// run only one instance of similar jobs per all session
	step.once.Do(func() {
		step.wg.Add(1)
		err = step.run(ctx)
		step.wg.Done()
	})
	// with waiting of similar jobs
	step.wg.Wait()

	return err
}

// String implements fmt.Stringer interface
func (step *Job) String() string {
	return fmt.Sprintf("JOB(%s, ID=%d)", step.Entrypoint, reflect.ValueOf(step).Pointer())
}
