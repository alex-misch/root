package server

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"

	"github.com/boomfunc/root/tools/chronometer"
	"github.com/google/uuid"
)

// LogFormat describes how we want log object.
type LogFormat int

const (
	JSON LogFormat = iota // JSON representation
	REPR                  // String representation
)

type status int

const (
	unknown status = iota // Unknown status, need to resolve.
	success
	fail
)

var (
	ErrUnknownLogFormat = errors.New("base/server: Unknown log format.")
)

// Iteration describes incoming request statistics.
// Timing url, errors, etc
type Iteration struct {
	UUID        uuid.UUID               `json:",omitempty"`
	Error       error                   `json:",omitempty"`
	Chronometer chronometer.Chronometer `json:",omitempty"`
	url         string
	status      status
}

// NewIteration wraps incoming rwc with measuring functionality.
func NewIteration() *Iteration {
	return &Iteration{
		UUID:        uuid.New(),
		Chronometer: chronometer.New(),
	}
}

// log logs iteration's information data using specified format.
func (i *Iteration) log(logger io.Writer, format LogFormat) error {
	switch format {
	case JSON:
		return json.NewEncoder(logger).Encode(i)
	case REPR:
		_, err := fmt.Fprintln(logger, i)
		return err
	default:
		return ErrUnknownLogFormat
	}
}

// AccessLog logs everything except error message.
func (i *Iteration) AccessLog(logger io.Writer, format LogFormat) error {
	status := success
	if i.Error != nil {
		status = fail
	}

	iter := &Iteration{
		UUID:        i.UUID,
		url:         i.url,
		status:      status,
		Chronometer: i.Chronometer,
	}
	return iter.log(logger, format)
}

// ErrorLog logs only error message and associated UUID.
func (i *Iteration) ErrorLog(logger io.Writer, format LogFormat) error {
	// iter := &Iteration{
	// 	UUID:  i.UUID,
	// 	Error: i.Error,
	// }
	return i.log(logger, format)
}

func (i Iteration) Status() string {
	// Resolve status, based on error existence.
	if i.status == unknown {
		if i.Error == nil {
			i.status = success
		} else {
			i.status = fail
		}
	}

	// Get string representation of the status.
	switch i.status {
	case success:
		return "SUCCESS"
	case fail:
		return "ERROR"
	default:
		return "UNKNOWN"
	}
}

func (i Iteration) Url() string {
	if i.url == "" {
		return "/XXX/XXX/XXX"
	}
	return i.url
}

func (i Iteration) ErrorString() string {
	if i.Error != nil {
		return i.Error.Error()
	}
	return ""
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
		Url    string `json:",omitempty"`
		Status string `json:",omitempty"`
		Error  string `json:",omitempty"`
		alias
	}{
		// TODO: paths from router dynamically
		Url:    i.Url(),
		Status: i.Status(),
		Error:  i.ErrorString(),
		alias:  alias(i),
	})
}
