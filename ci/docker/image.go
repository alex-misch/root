package docker

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/docker/docker/api/types"
)

var (
	ErrUnsupportedDocker = errors.New("ci/docker: Unsupported type of docker image")
)

// getImage pulls or builds image and return resulting id
// `docker` is path to Dockerfile or path to hub -> build or pull operaiton will be performed
func GetImage(ctx context.Context, docker string) (string, error) {
	var name string
	// detect what kind of fetch we need (pull or build)
	// TODO from pattql create virtual url-view struct
	if strings.HasPrefix(docker, "docker://") {
		// get or pull case
		name = strings.TrimPrefix(docker, "docker://")

		if reader, err := Client.ImagePull(ctx, name, types.ImagePullOptions{}); err != nil {
			return "", fmt.Errorf("ci/docker: %s", err)
		} else {
			// here we need to close reader and wait for end of stream
			// NOTE: otherwise bug with `no such image`

			// TODO: read to /dev/null

			if err := reader.Close(); err != nil {
				return "", fmt.Errorf("ci/docker: %s", err)
			}
		}
	} else {
		return "", ErrUnsupportedDocker
		// build case, path to dockerfile
		// open it, provide to helper function as context
		// dockerfile, err := os.Open(docker)
		// if err != nil {
		// 	return "", err
		// }
		// // TODO
		// name = "unknown"
		// // build image
		// // TODO: check returned io.ReadCloser is closed if `_`
		// if _, err := Client.ImageBuild(context.Background(), dockerfile, types.ImageBuildOptions{}); err != nil {
		// 	return "", err
		// }
	}

	// get id from pulled/builded image
	info, _, err := Client.ImageInspectWithRaw(ctx, name)
	if err != nil {
		return "", fmt.Errorf("ci/docker: %s", err)
	}

	// success case - return id
	return info.ID, nil
}

// RemoveImage removes image by their identifier from host
// func RemoveImage(ctx context.Context, id string) error {
// 	opts, err := client.ImageRemove(ctx, id, types.ImageRemoveOptions{Force: true})
// 	fmt.Println(opts)
// 	return err
// }
