package flow

import (
	"context"
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
	RWC         io.ReadWriteCloser
	Ctx         context.Context
	Chronometer *chronometer.Chronometer
	Stat        Stat
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
