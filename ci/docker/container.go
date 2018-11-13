package docker

import (
	"context"
	"errors"
	"io"
	"os"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
)

// RemoveContainer removes container from host docker
func RemoveContainer(id string) error {
	return Client.ContainerRemove(context.Background(), id, types.ContainerRemoveOptions{
		RemoveVolumes: true,
		Force:         true,
	})
}

// LogContainer saves container logs to anything
func LogContainer(id string, w io.Writer) error {
	// get logs (success case)
	r, err := Client.ContainerLogs(context.Background(), id, types.ContainerLogsOptions{ShowStdout: true})
	if err != nil {
		return err
	}

	// save
	io.Copy(w, r)

	return nil
}

func RunContainer(image, entrypoint, workdir string) error {
	ctx := context.Background()

	// Create container with dynamic options
	resp, err := Client.ContainerCreate(
		ctx,
		&container.Config{
			WorkingDir: "/go/src/github.com/boomfunc/root/ci", // NOTE: working directory always same as `source mount` or default by image
			Image:      image,
			Entrypoint: []string{"sh", "-c"},
			Cmd:        []string{entrypoint},
		},
		&container.HostConfig{
			Mounts: Mounts(),
		},
		nil,
		"",
	)
	if err != nil {
		return err
	}

	// clear docker host anyway
	defer RemoveContainer(resp.ID)

	// save container logs in any way
	defer LogContainer(resp.ID, os.Stdout)

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
		}
	}

	return nil
}
