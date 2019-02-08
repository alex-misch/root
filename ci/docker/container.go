package docker

import (
	"context"
	"errors"
	"fmt"
	"io"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
)

// RemoveContainer removes container from host docker
// with all garbage as volume and etc
func RemoveContainer(ctx context.Context, id string) error {
	return Client.ContainerRemove(ctx, id, types.ContainerRemoveOptions{
		RemoveVolumes: true,
		Force:         true,
	})
}

// LogContainer saves container logs to anything that implements io.Writer interface (file, socket, pipe)
func LogContainer(ctx context.Context, id string, w io.Writer) error {
	// if writer is nil - no need to save logs
	if w == nil {
		return nil
	}

	// get logs (success case)
	r, err := Client.ContainerLogs(ctx, id, types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true})
	if err != nil {
		return err
	}
	// logs reader available - close it after reading
	defer r.Close()

	// save logs to writer
	io.Copy(w, r)

	return nil
}

// RunContainerOptions describes how docker container will be runned
type RunContainerOptions struct {
	Image      string     // image identifier to use
	Entrypoint string     // entrypoint (will be wrapped to sh -c '${entrypoint}')
	Workdir    string     // where we will be at default?
	MountPaths [][]string // which volumes we need to mount?
	Env        []string   // environment variables to pass to container
	Log        io.Writer  // where to save logs
}

// RunContainer is a complex of the following tasks
// - create container
// - run container
// - save logs
// - garbage (rm container)
func RunContainer(ctx context.Context, opts RunContainerOptions) error {
	// calculate mounts for containers
	mounts := Mounts(opts.MountPaths...)
	// create dirs for mounting
	if err := CreateMountDirs(mounts); err != nil {
		return err
	}

	// now we can start container
	// Create container with dynamic options
	resp, err := Client.ContainerCreate(
		ctx,
		&container.Config{
			WorkingDir: opts.Workdir, // NOTE: working directory always same as `source mount` or default by image
			Image:      opts.Image,
			Entrypoint: []string{"sh", "-eux", "-c"}, // NOTE: automatically enable set -eux for strict shell execution
			Cmd:        []string{opts.Entrypoint},
			Env:        opts.Env,
		},
		&container.HostConfig{
			Mounts: mounts,
		},
		nil,
		"",
	)
	if err != nil {
		return err
	}

	// clear docker host anyway
	defer RemoveContainer(ctx, resp.ID)

	// save container logs in any way
	defer LogContainer(ctx, resp.ID, opts.Log)

	// Start container
	if err := Client.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
		return err
	}

	// Wait for container finish
	statusCh, errCh := Client.ContainerWait(ctx, resp.ID, container.WaitConditionNotRunning)
	select {
	case err := <-errCh:
		if err != nil {
			return err
		}
	case resp := <-statusCh:
		if resp.Error != nil {
			return errors.New(resp.Error.Message)
		} else if resp.StatusCode != 0 {
			return fmt.Errorf("Exit code: %d. Look at container logs for more information", resp.StatusCode)
		}
	}

	return nil
}
