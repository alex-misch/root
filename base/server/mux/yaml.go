package mux

import (
	"io"
	"net/http"
	"os"

	"gopkg.in/yaml.v2"
)

func loadYAML(r io.Reader) (Router, error) {
	// Try to read raw yaml
	decoder := yaml.NewDecoder(r)
	decoder.SetStrict(false)

	var router Router

	if err := decoder.Decode(&router); err != nil {
		return nil, err
	}

	return router, nil
}

// FromFile loads YAML config from local file system by name
func FromFile(name string) (Router, error) {
	// try to open file and get io.Reader
	f, err := os.Open(name)
	if err != nil {
		return nil, err
	}

	// parse yaml
	return loadYAML(f)
}

// FromHTTP loads YAML config from http
func FromHTTP(url string) (Router, error) {
	// try to open file and get io.Reader
	r, err := http.Get(url)
	if err != nil {
		return nil, err
	}

	// parse yaml
	return loadYAML(r.Body)
}
