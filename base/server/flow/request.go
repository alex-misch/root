package flow

import (
	"io"
	"net/url"
)

type Request struct {
	Url   *url.URL
	Input io.Reader
}

func NewRequest(raw string, input io.Reader) (*Request, error) {
	u, err := url.Parse(raw)
	if err != nil {
		return nil, err
	}

	request := &Request{
		Url:   u,
		Input: input,
	}

	return request, nil
}
