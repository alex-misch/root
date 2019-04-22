package flow

import (
	"context"
	"encoding/json"
	"fmt"
	"io"

	srvctx "github.com/boomfunc/root/base/server/context"
	"github.com/boomfunc/root/tools/chronometer"
	"github.com/google/uuid"
)

type Stat struct {
	Req *Request
	Err error
}

type Data struct {
	UUID        uuid.UUID
	RWC         io.ReadWriteCloser `json:"-"`
	Ctx         context.Context    `json:"-"`
	Stat        Stat               `json:"-"`
	Chronometer *chronometer.Chronometer
}

func New(rwc io.ReadWriteCloser) *Data {
	return &Data{
		UUID:        uuid.New(),
		RWC:         rwc,
		Ctx:         srvctx.New(),
		Chronometer: chronometer.New(),
	}
}

func (d Data) Successful() bool {
	return d.Stat.Err == nil
}

// Error implements error interface
func (d Data) Error() string {
	return fmt.Sprintf("%s\t-\t%s", d.UUID.String(), d.Stat.Err)
}

// MarshalJSON implements json.Marshaler interface
// because we need dynamic fields not declared on structure
func (d Data) MarshalJSON() ([]byte, error) {
	type alias Data // to prevent infinity loop

	var status, url string

	if d.Successful() {
		status = "SUCCESS"
	} else {
		status = "ERROR"
	}

	// Request might be nil if err while parsing incoming message
	if d.Stat.Req != nil {
		url = d.Stat.Req.Url.RequestURI()
	} else {
		url = "/XXX/XXX/XXX"
	}

	return json.Marshal(&struct {
		Url    string
		Status string
		alias
	}{
		// TODO: paths from router dynamically
		Url:    url,
		Status: status,
		alias:  alias(d),
	})
}
