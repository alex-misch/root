package transport

import (
	"fmt"
	"net"

	"github.com/boomfunc/root/base/tools/poller"
)

func TCP(ip net.IP, port int) (Interface, error) {
	addr, err := net.ResolveTCPAddr("tcp", fmt.Sprintf("%s:%d", ip, port))
	if err != nil {
		return nil, err
	}

	listener, err := net.ListenTCP("tcp", addr)
	if err != nil {
		return nil, err
	}

	heap, err := poller.Heap()
	if err != nil {
		listener.Close() // garbage
		return nil, err
	}

	tr := &tcp{
		listener: listener,
		poller:   heap,
	}
	return tr, nil
}
