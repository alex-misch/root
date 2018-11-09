package docker

import (
	"context"
	"errors"
	// "fmt"
	"io"
	"os"
	"strings"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	// "github.com/docker/docker/api/types/mount"
)

// RemoveContainer removes container from host docker
func RemoveContainer(id string) error {
	return Client.ContainerRemove(context.Background(), id, types.ContainerRemoveOptions{
		RemoveVolumes: true,
		Force:         true,
	})
}

func RunContainer(image, entrypoint, workdir string) error {
	ctx := context.Background()

	// create volumes
	// srcVolume, err := SrcVolume()
	// if err != nil {
	// 	return err
	// }
	// fmt.Println("FFFF:", srcVolume.Mountpoint)

	// create container with dynamic options
	resp, err := Client.ContainerCreate(
		ctx,
		&container.Config{
			WorkingDir:      "/bmpci/src",
			Image:           image,
			Entrypoint:      strings.Split(entrypoint, " "),
			NetworkDisabled: true,
			Volumes: map[string]struct{}{
				"src": struct{}{},
			},
		},
		// &container.HostConfig{
		// 	Mounts: []mount.Mount{
		// 		mount.Mount{
		// 			Type:   mount.TypeVolume,
		// 			Source: srcVolume.Name,
		// 			// Source: "/bmpci/repos/e443156edcb4f6431d71fc14c586dabe47bb858a19b2b31a598eeadbef8cf45f",
		// 			Target: "/bmpci/src",
		// 		},
		// 		// mount.Mount{
		// 		// 	Type:   mount.TypeBind,
		// 		// 	Source: "cache",
		// 		// 	Target: "/bmpci/cache",
		// 		// },
		// 		// mount.Mount{
		// 		// 	Type:   mount.TypeBind,
		// 		// 	Source: "artifact",
		// 		// 	Target: "/bmpci/artifact",
		// 		// },
		// 	},
		// },
		nil,
		nil,
		"",
	)
	if err != nil {
		return err
	}

	// clear docker host anyway
	defer RemoveContainer(resp.ID)

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

	// TODO: save logs to file
	// get logs (success case)
	out, err := Client.ContainerLogs(ctx, resp.ID, types.ContainerLogsOptions{ShowStdout: true})
	if err != nil {
		return err
	}

	io.Copy(os.Stdout, out)

	return nil
}
