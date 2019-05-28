package mux

// custom http.ResponseWriter. Beta version.

import (
	"bytes"
	"net/http"

	"github.com/boomfunc/root/base/tools"
)

type httprw struct {
	header http.Header
	body   *bytes.Buffer
	code   int
}

func NewHTTPResponseWriter() *httprw {
	return &httprw{
		body: new(bytes.Buffer),
		code: http.StatusOK,
	}
}

// Header returns headers map.
// Header implements the http.ResponseWriter interface.
func (rw *httprw) Header() http.Header {
	if rw.header == nil {
		rw.header = make(http.Header, 0)
	}
	return rw.header
}

// Write writes body part of response.
// Implements both the io.Writer and http.ResponseWriter interfaces.
func (rw *httprw) Write(data []byte) (int, error) {
	if rw.body != nil {
		return rw.body.Write(data)
	}

	return len(data), nil
}

// WriteHeader writes status code.
// Header implements the http.ResponseWriter interface.
func (rw *httprw) WriteHeader(code int) {
	// check valid status is writing
	if reason := http.StatusText(code); reason != "" {
		rw.code = code
	}
}

// Status returns actual status code
func (rw *httprw) StatusCode() int {
	return rw.code
}

// Response returns final http.Response made via current http.ResponseWriter.
// Receives request for which response was generated.
func (rw *httprw) Response(r *http.Request) *http.Response {
	return &http.Response{
		Status:        http.StatusText(rw.StatusCode()),
		StatusCode:    rw.StatusCode(),
		Proto:         r.Proto,
		ProtoMajor:    r.ProtoMajor,
		ProtoMinor:    r.ProtoMinor,
		Body:          tools.ReadCloser(rw.body),
		Request:       r,
		Header:        rw.header, // NOTE: use attribute directly to avoid unnecessary creating map via .Header()
		ContentLength: int64(rw.body.Len()),
	}
}
