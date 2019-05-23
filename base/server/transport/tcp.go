package transport

import (
	"container/heap"
	"net"
	"time"

	"github.com/boomfunc/root/base/tools/poller"
)

// TODO: implement net.Listener interface

var (
	// TODO parametrize
	readTimeout  = time.Second * 2
	writeTimeout = time.Second * 5
)

type tcp struct {
	listener *net.TCPListener
	poller   heap.Interface // also connect with poller
	errCh    chan error
}

func (tr *tcp) Len() int {
	return tr.poller.Len()
}

func (tr *tcp) Less(i, j int) bool {
	return tr.poller.Less(i, j)
}

func (tr *tcp) Swap(i, j int) {
	tr.poller.Swap(i, j)
}

func (tr *tcp) Push(x interface{}) {
	heap.Push(tr.poller, x)
}

func (tr *tcp) Pop() interface{} {
	return heap.Pop(tr.poller)
}

func (tr *tcp) Connect(errCh chan error) {
	tr.errCh = errCh
}

func (tr *tcp) Serve() {
	for {
		conn, err := tr.listener.AcceptTCP()
		if err != nil {
			// if err, ok := err.(net.Error); ok {
			// 	// this can be temporary error, we can just reconnect
			// 	fmt.Println("TMP ERROR FROM TCP, need to reconnect:", err.Temporary())
			// }
			tr.errCh <- err
			continue
		}

		fd, err := tcpFD(conn)
		if err != nil {
			tr.errCh <- err
			continue
		}

		// set timeouts
		// if err := conn.SetReadDeadline(time.Now().Add(readTimeout)); err != nil {
		// 	tr.errCh <- err
		// 	continue
		// }
		//
		// if err := conn.SetWriteDeadline(time.Now().Add(writeTimeout)); err != nil {
		// 	tr.errCh <- err
		// 	continue
		// }

		// push incoming connection to heap
		item := &poller.HeapItem{Fd: fd, Value: conn}
		heap.Push(tr.poller, item)
	}
}
