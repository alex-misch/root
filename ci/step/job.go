package step

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/boomfunc/log"
	"github.com/boomfunc/root/ci/docker"
	"github.com/boomfunc/root/ci/tools"
	"github.com/google/uuid"
)

var (
	// describes situation when step haven't got required context information about himself to run
	ErrStepOrphan = errors.New("step: Step run without required context")
)

// JobEnvironment describes the environment in which the job is running
// used for generating unique name for container and for store keys
type JobEnvironment struct {
	session   string // unique session uuid
	origin    string // repository origin `github.com/boomfunc/root`
	pack      string // package name relative to session (graph) root `base/tools`
	name      string // job name (`test`, `build`, `deploy`)
	container string // unique container uuid
	context   string // directory, mountied as `src`
}

// NewEnv returns new job environment to calculating mount paths
func NewEnv(session, origin, pack, name, container, context string) *JobEnvironment {
	return &JobEnvironment{session, origin, pack, name, container, context}
}

// LogPath returns the full path to log file, associated with this environment
func (env *JobEnvironment) LogPath() string {
	return tools.LogPath(
		env.container,
	)
}

// SrcPath returns the full path to the directory that will be passed to the container as a `src`
// if necessary (if JobMount have `SrcPath` non empty)
func (env *JobEnvironment) SrcPath() string {
	return tools.AbsWorkdir(
		tools.RepoPath(env.origin),
		env.pack,
		env.context,
	)
}

// ArtifactPath returns the full path to the directory that will be passed to the container as a `artifact`
// if necessary (if JobMount have `ArtifactPath` non empty)
func (env *JobEnvironment) ArtifactPath() string {
	return tools.ArtifactPath(
		env.session,
		env.origin,
		env.pack,
	)
}

// CachePath returns the full path to the directory that will be passed to the container as a `cache`
// if necessary (if JobMount have `CachePath` non empty)
func (env *JobEnvironment) CachePath() string {
	return tools.CachePath(
		env.origin,
		env.pack,
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
	UUID  uuid.UUID
	Mount JobMount `yaml:"mount,omitempty,flow"`

	Context    string `yaml:"context,omitempty"`    // path to directory to mount as `src`
	Docker     string `yaml:"docker,omitempty"`     // docker image to use
	Entrypoint string `yaml:"entrypoint,omitempty"` // command to run (overrides docker ENTRYPOINT)

	once sync.Once      // used for running only one instance of docker container of similar jobs per all flow
	wg   sync.WaitGroup // used for waiting another similar jobs completion of the original job (first runned)
}

// NewJob returns single step for docker running
func NewJob(context, docker, entrypoint string) Interface {
	return &Job{
		Context:    context,
		Docker:     docker,
		Entrypoint: entrypoint,
	}
}

// func (step *Job) UnmarshalYAML(unmarshal func(interface{}) error) error {
// 	var job Job
//
// 	if err := unmarshal(&job); err != nil {
// 		return err
// 	}
//
// 	// extend information - id
// 	job.UUID = uuid.New()
// 	// change direct job by change pointing to another address
// 	step = &job
//
// 	return nil
// }

// run runs single docker container
// with provided src and destination dirs as volumes
func (step *Job) run(ctx context.Context) error {
	step.UUID = uuid.New()

	var session, origin, pack, name string

	// trying to get required attributes from context and check it
	session = ctx.Value("session").(string)
	origin = ctx.Value("origin").(string)
	pack = ctx.Value("pack").(string)
	name = ctx.Value("name").(string)
	// if check failed - not enough context information provided -> step is orphan
	if session == "" || origin == "" || pack == "" || name == "" {
		return ErrStepOrphan
	}

	// get image id for container
	log.Debugf("Session(%s) -> %s", session, step)
	image, err := docker.GetImage(ctx, step.Docker)
	if err != nil {
		return err
	}

	// TODO
	// TODO: defer ImageRemove()
	// TODO

	// Create and run container
	return docker.RunContainer(
		ctx, // context for cancellation
		docker.RunContainerOptions{
			Image:      image,
			Entrypoint: step.Entrypoint,
			Workdir:    step.Mount.SrcPath,
			MountPaths: step.Mount.Entries( // get mount paths
				NewEnv( // create new environment for calculating paths
					session,
					origin, pack, name,
					step.UUID.String(),
					step.Context,
				),
			),
			// Log
		},
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
	return fmt.Sprintf("JOB(%s)", step.UUID)
}
