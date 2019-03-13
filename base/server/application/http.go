package application

import (
	"bufio"
	"context"
	"io"
	"net/http"
	"time"

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
	// get user agent and save to context
	srvctx.SetMeta(ctx, "ua", httpRequest.UserAgent())
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
	storage, ok := ctx.Value("db").(kvs.DB)
	if !ok {
		return executor.ErrStepOrphan
	}

	var status int
	// wait for http status code in storage
	if b, _ := storage.Get("http", "wait").(bool); b {
		storage.Wait("http", "status")
		status, ok = storage.Get("http", "status").(int)
		if !ok {
			return executor.ErrStepOrphan
		}
	} else {
		status = 200
	}

	// generate response
	response := http.Response{
		Status:     http.StatusText(status),
		StatusCode: status,
		Proto:      packer.request.Proto,
		ProtoMajor: packer.request.ProtoMajor,
		ProtoMinor: packer.request.ProtoMinor,
		Body:       tools.ReadCloser(r),
		Request:    packer.request,
		Header:     make(http.Header, 0),
	}

	defer response.Body.Close()
	// BUG with HEAD Method:
	// https://play.golang.org/p/B84EotwMb2J

	// HEADERS SECTION
	// default headers values
	response.Header.Set("Content-Type", "text/plain; charset=utf-8")
	response.Header.Set("X-Content-Type-Options", "nosniff")
	response.Header.Set("Date", time.Now().Format(time.RFC1123))

	// CORS ISSUE while not structured application layer
	if packer.request.Header.Get("Origin") != "" {
		// TODO TODO
		response.Header.Set("Access-Control-Allow-Origin", "*")
		response.Header.Set("Access-Control-Allow-Headers", "Authorization")
		response.Header.Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		// TODO TODO
	}

	// Custom headers. Get some additional runtime headers (if exists)
	more, ok := storage.Get("http", "headers").(http.Header)
	if ok { // additional headrs exists
		for k := range more {
			response.Header.Set(k, more.Get(k))
		}
	}

	// TODO: immutable headers
	response.Header.Set("Server", "base/3.0.0-rc6") // TODO: not dynamic https://tools.ietf.org/html/rfc7231#section-7.4.2

	return response.Write(w)
}
