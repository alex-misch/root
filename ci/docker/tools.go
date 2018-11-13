package docker

import (
	"github.com/docker/docker/api/types/mount"
)

// Mounts is tool for creating slice of mounts from pairs (from, to)
func Mounts(paths ...[]string) []mount.Mount {
	mounts := make([]mount.Mount, len(paths))

	for i, pair := range paths {
		if len(pair) != 2 {
			continue
		}

		mounts[i] = mount.Mount{
			Type:   mount.TypeBind,
			Source: pair[0], // from (host path)
			Target: pair[1], // to (container path)
		}
	}

	return mounts
}
