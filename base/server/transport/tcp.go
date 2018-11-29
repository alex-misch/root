package transport

import (
	"container/heap"
	"net"
	"time"

	"github.com/boomfunc/root/base/server/flow"
	"github.com/boomfunc/root/base/tools/poller"
)

var (
	// TODO parametrize
	readTimeout  = time.Second * 2
	writeTimeout = time.Second * 5
)

type tcp struct {
	listener *net.TCPListener
	heap     heap.Interface // also connect with poller
	errCh    chan error
}

func (tr *tcp) Len() int {
	return tr.heap.Len()
}

func (tr *tcp) Less(i, j int) bool {
	return tr.heap.Less(i, j)
}

func (tr *tcp) Swap(i, j int) {
	tr.heap.Swap(i, j)
}

func (tr *tcp) Push(x interface{}) {
	tr.heap.Push(x)
}

func (tr *tcp) Pop() interface{} {
	return tr.heap.Pop()
}

func (tr *tcp) Connect(errCh chan error) {
	tr.errCh = errCh
}

func (tr *tcp) Serve() {
	for {
		conn, err := tr.listener.AcceptTCP()
		if err != nil {
			tr.errCh <- err
			continue
		}

		fd, err := tcpFD(conn)
		if err != nil {
			tr.errCh <- err
			continue
		}

		// push incoming connection to heap
		flow := flow.New(conn)
		item := &poller.HeapItem{Fd: fd, Value: flow}
		flow.Chronometer.Enter("transport")
		heap.Push(tr.heap, item)
	}
}
