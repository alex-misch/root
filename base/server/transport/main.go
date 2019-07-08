package transport

import (
	"container/heap"
	"time"
)

var (
	// TODO parametrize
	readTimeout  = time.Second * 2
	writeTimeout = time.Second * 5
)

// Interface describes main idea of transport layer.
// Receiving data from outside (internet, cron, etc) and pass to local heap
// Server will know only heap.Interface and heap.Pop(transport) method
// All Kind or errors to channel (also created by server)
type Interface interface {
	Connect(chan error)
	Serve()
	heap.Interface
}
