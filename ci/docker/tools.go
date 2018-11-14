package docker

import (
	"os"

	"github.com/docker/docker/api/types/mount"
)

func CreateMountDirs(mounts []mount.Mount) error {
	for _, mount := range mounts {
		if _, err := os.Stat(mount.Source); err != nil {
			if os.IsNotExist(err) {
				if err := os.MkdirAll(mount.Source, os.ModePerm); err != nil {
					return err
				}
			} else {
				return err
			}
		}
	}

	return nil
}

// Mounts is tool for creating slice of mounts from pairs (from, to)
func Mounts(paths ...[]string) []mount.Mount {
	mounts := make([]mount.Mount, 0)

	for _, pair := range paths {
		if len(pair) != 2 {
			continue
		}

		mounts = append(mounts, mount.Mount{
			Type:   mount.TypeBind,
			Source: pair[0], // from (host path)
			Target: pair[1], // to (container path)
		})
	}

	switch len(mounts) {
	case 0:
		return nil
	default:
		return mounts
	}
}
