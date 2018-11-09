package docker

import (
	"context"

	"github.com/docker/docker/api/types"
	volumetypes "github.com/docker/docker/api/types/volume"
)

func SrcVolume() (types.Volume, error) {

	return Client.VolumeCreate(
		context.Background(),
		volumetypes.VolumeCreateBody{
			Driver: "local",
			DriverOpts: map[string]string{
				"device": "/bmpci/repos/e443156edcb4f6431d71fc14c586dabe47bb858a19b2b31a598eeadbef8cf45f",
			},
			Name: "src",
		},
	)
}
