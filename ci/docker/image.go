package docker

import (
	"context"
	// "os"
	"errors"
	"strings"

	"github.com/docker/docker/api/types"
)

var (
	ErrUnsupportedDocker = errors.New("Unsupported type of docker image")
)

// TODO: context separate - not good
// getImage pulls or builds image and return resulting id
// `docker` is path to Dockerfile or path to hub -> build or pull operaiton will be performed
func GetImage(docker string) (string, error) {
	var name string
	// detect what kind of fetch we need (pull or build)
	// TODO from pattql create virtual url-view struct
	if strings.HasPrefix(docker, "docker://") {
		// pull case
		name = strings.TrimPrefix(docker, "docker://")
		// TODO: check returned io.ReadCloser is closed if `_`
		if _, err := Client.ImagePull(context.Background(), name, types.ImagePullOptions{}); err != nil {
			return "", err
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

	// TODO fill options to name that used below to get id
	// get id from pulled/builded image
	info, _, err := Client.ImageInspectWithRaw(context.Background(), name)
	if err != nil {
		return "", err
	}

	// successful result
	return info.ID, nil
}

// func RemoveImage(client *client.Client, id string) error {
// 	opts, err := client.ImageRemove(context.Background(), id, types.ImageRemoveOptions{Force: true})
// 	fmt.Println(opts)
// 	return err
// }
