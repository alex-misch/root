package server

import (
	"encoding/json"
	"fmt"
	"io"

	"github.com/boomfunc/root/tools/chronometer"
	"github.com/google/uuid"
)

// Iteration describes incoming request statistics.
// Timing url, errors, etc
type Iteration struct {
	UUID        uuid.UUID
	Err         error `json:",omitempty"`
	url         string
	Chronometer chronometer.Chronometer
}

// NewIteration wraps incoming rwc with measuring functionality.
func NewIteration() *Iteration {
	return &Iteration{
		UUID:        uuid.New(),
		Chronometer: chronometer.New(),
	}
}

// Info logs information data. Just access log.
func (i *Iteration) Info(logger io.Writer) error {
	_, err := fmt.Fprintln(logger, i)

	if true {
		return err
	}

	return json.NewEncoder(logger).Encode(i)
}

// Error logs traceback error data.
func (i *Iteration) Error(logger io.Writer) error {
	_, err := fmt.Fprintln(logger, i)

	if true {
		return err
	}

	return json.NewEncoder(logger).Encode(i)
}

func (i Iteration) Status() string {
	if i.Err == nil {
		return "SUCCESS"
	}
	return "ERROR"
}

func (i Iteration) Url() string {
	if i.url == "" {
		return "/XXX/XXX/XXX"
	}
	return i.url
}

// String implements the fmt.Stringer interface.
// Used as `repr` logging mode.
func (i Iteration) String() string {
	return fmt.Sprintf("%s\t-\t%s\t-\t%s\t-\tTiming: `%s`", i.UUID, i.Url(), i.Status(), i.Chronometer)
}

// MarshalJSON implements the json.Marshaler interface.
// Because we need dynamic fields not declared on structure.
func (i Iteration) MarshalJSON() ([]byte, error) {
	type alias Iteration // to prevent infinity loop

	return json.Marshal(&struct {
		Url    string
		Status string
		alias
	}{
		// TODO: paths from router dynamically
		Url:    i.Url(),
		Status: i.Status(),
		alias:  alias(i),
	})
}
