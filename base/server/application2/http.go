package application2

import (
	"io"
	"net/http"
)

type httprw struct {
	h      http.Header
	w      io.Writer
	status int
}

func (w *httprw) Header() http.Header {
	if w.h == nil {
		w.h = make(http.Header, 0)
	}
	return w.h
}

func (w *httprw) Write(data []byte) (int, error) {
	return w.w.Write(data)
}

func (w *httprw) WriteHeader(status int) {
	w.status = status
}

func (w *httprw) Status() int {
	if w.status == 0 {
		return http.StatusOK
	}
	return w.status
}
