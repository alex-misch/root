// Package conf is a layer between `tools.Router` and based on specific node (project, service)
// methods of parsing and fetching router. For example: from config files, remote location, etc.
// Also describes concrete type of `flow.Step` used in `tools.Router`
// in `base` case - pipeline
package conf

import (
	"io"
	"net/http"
	"os"

	"gopkg.in/yaml.v2"
)

func loadYAML(r io.Reader) (*Router, error) {
	// Try to read raw yaml
	decoder := yaml.NewDecoder(r)
	decoder.SetStrict(false)

	var router Router
	if err := decoder.Decode(&router); err != nil {
		return nil, err
	}

	return &router, nil
}

// LoadLocalFile loads YAML config from local file system by name
func LoadLocalFile(name string) (*Router, error) {
	// try to open file and get io.Reader
	f, err := os.Open(name)
	if err != nil {
		return nil, err
	}

	// parse yaml
	return loadYAML(f)
}

// LoadExternalFile loads YAML config from http
func LoadExternalFile(url string) (*Router, error) {
	// try to open file and get io.Reader
	r, err := http.Get(url)
	if err != nil {
		return nil, err
	}

	// parse yaml
	return loadYAML(r.Body)
}
