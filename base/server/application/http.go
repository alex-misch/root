package application

import (
	"bufio"
	"context"
	"io"
	"net/http"

	srvctx "github.com/boomfunc/root/base/server/context"
	"github.com/boomfunc/root/base/server/flow"
	"github.com/boomfunc/root/base/tools"
	executor "github.com/boomfunc/root/tools/flow"
	"github.com/boomfunc/root/tools/kvs"
)

// Load test
// seq 1000 | xargs -n 1 -P 250 sh -c "curl -i http://playground.lo:8080/geo?ip=185.86.151.11"
type httpPacker struct {
	request *http.Request
}

func (packer *httpPacker) Unpack(ctx context.Context, r io.Reader) (*flow.Request, error) {
	br := bufio.NewReader(r)
	httpRequest, err := http.ReadRequest(br)
	if err != nil {
		return nil, err
	}

	// extend ctx
	// get remote ip and save to context
	srvctx.SetMeta(
		ctx, "ip",
		tools.GetRemoteIP(
			tools.GetRemoteAddr(r),
			httpRequest.Header.Get("X-Forwarded-For"),
			httpRequest.Header.Get("X-Real-IP"),
		),
	)
	// Get http query and save to context
	values, err := srvctx.Values(ctx)
	if err != nil {
		return nil, err
	}
	values.Q = httpRequest.URL.Query()

	packer.request = httpRequest

	return flow.NewRequest(
		httpRequest.URL.RequestURI(),
		httpRequest.Body,
	)
}

func (packer *httpPacker) Pack(ctx context.Context, r io.Reader, w io.Writer) error {
	// get status code and string reason from
	storage, ok := ctx.Value("db").(*kvs.DB)
	if !ok {
		return executor.ErrStepOrphan
	}

	ch := storage.Wait("http.status") // blocking operation
	var status interface{}
	if ch != nil {
		status = <-ch
	} else {
		status = storage.Get("http.status")
	}

	asInt, ok := status.(int)
	if !ok {
		return executor.ErrStepOrphan
	}

	response := &http.Response{
		Status:     http.StatusText(asInt),
		StatusCode: asInt,
		Proto:      packer.request.Proto,
		ProtoMajor: packer.request.ProtoMajor,
		ProtoMinor: packer.request.ProtoMinor,
		Body:       tools.ReadCloser(r),
		Request:    packer.request,
	}

	defer response.Body.Close()

	// headers section
	response.Header = make(http.Header)

	// CORS ISSUE while not structured application layer
	if packer.request.Header.Get("Origin") != "" {
		// TODO TODO
		response.Header.Set("Access-Control-Allow-Origin", "*")
		response.Header.Set("Access-Control-Allow-Headers", "")
		response.Header.Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		// TODO TODO
	}

	return response.Write(w)
}
