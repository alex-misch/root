package docker

import (
	"github.com/docker/docker/client"
)

var Client *client.Client

// init docker client
func init() {
	var err error

	Client, err = client.NewClientWithOpts(client.WithVersion("1.38"))

	if err != nil {
		panic(err)
	}
}
