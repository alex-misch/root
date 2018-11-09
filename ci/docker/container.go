package docker

import (
	"context"
	"errors"
	// "fmt"
	"io"
	"os"
	// "strings"
	"path/filepath"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/mount"
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

	// create container with dynamic options
	resp, err := Client.ContainerCreate(
		ctx,
		&container.Config{
			// WorkingDir:      "/bmpci/src",
			WorkingDir: "/go/src/github.com/boomfunc/root/ci",
			Image:      image,
			Entrypoint: []string{"sh", "-c"},
			Cmd:        []string{entrypoint},
			// NetworkDisabled: true,
			// Volumes: map[string]struct{}{
			// 	// "/bmpci/src":      struct{}{},
			// 	// "/bmpci/cache":    struct{}{},
			// 	// "/bmpci/artifact": struct{}{},
			// 	"/go/src/github.com/boomfunc/root/ci": struct{}{},
			// 	"/bmpci/cache": struct{}{},
			// 	"/go/bin": struct{}{},
			// },
		},
		&container.HostConfig{
			Mounts: []mount.Mount{
				mount.Mount{
					Type:   mount.TypeBind,
					Source: filepath.Join("/bmpci/repos/e443156edcb4f6431d71fc14c586dabe47bb858a19b2b31a598eeadbef8cf45f", workdir),
					// Target: "/bmpci/src",
					Target: "/go/src/github.com/boomfunc/root/ci",
				},
				mount.Mount{
					Type:   mount.TypeBind,
					Source: "/bmpci/cache/e443156edcb4f6431d71fc14c586dabe47bb858a19b2b31a598eeadbef8cf45f",
					Target: "/bmpci/cache",
					// Target: "/go/src/github.com/boomfunc/root/ci",
				},
				mount.Mount{
					Type:   mount.TypeBind,
					Source: "/bmpci/artifact/e443156edcb4f6431d71fc14c586dabe47bb858a19b2b31a598eeadbef8cf45f",
					// Target: "/bmpci/artifact",
					Target: "/go/bin",
				},
			},
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

	// Create and start container
	if err := Client.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
		return err
	}

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
