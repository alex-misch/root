package application

// import (
// 	"context"
// 	"net/http"
// )
//
// type http struct {}
//
// func (unpacker *http) Unpack(ctx context.Context) error {
// 	// extend ctx
// 	// get remote ip and save to context
// 	srvctx.SetMeta(
// 		ctx, "ip",
// 		tools.GetRemoteIP(
// 			tools.GetRemoteAddr(r),
// 			httpRequest.Header.Get("X-Forwarded-For"),
// 			httpRequest.Header.Get("X-Real-IP"),
// 		),
// 	)
// 	// Get http query and save to context
// 	values, err := srvctx.Values(ctx)
// 	if err != nil {
// 		return nil, err
// 	}
// 	values.Q = httpRequest.URL.Query()
//
// 	unpacker.request = httpRequest
//
// 	return flow.NewRequest(
// 		httpRequest.URL.RequestURI(),
// 		httpRequest.Body,
// 	)
// }
//
// func (packer *http) Pack(ctx context.Context) error {
// 	response := &http.Response{
// 		Status:     "200 OK",
// 		StatusCode: 200,
// 		Proto:      packer.request.Proto,
// 		ProtoMajor: packer.request.ProtoMajor,
// 		ProtoMinor: packer.request.ProtoMinor,
// 		Body:       tools.ReadCloser(r),
// 		Request:    packer.request,
// 	}
//
// 	defer response.Body.Close()
//
// 	// headers section
// 	response.Header = make(http.Header)
//
// 	// CORS ISSUE while not structured application layer
// 	if packer.request.Header.Get("Origin") != "" {
// 		// TODO TODO
// 		response.Header.Set("Access-Control-Allow-Origin", "*")
// 		response.Header.Set("Access-Control-Allow-Headers", "")
// 		response.Header.Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
// 		// TODO TODO
// 	}
//
// 	return 0, response.Write(w)
// }
