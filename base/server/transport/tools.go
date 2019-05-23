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
		return nil, err
	}

	tcp := &tcp{
		listener: listener,
		poller:   heap,
	}
	return tcp, nil
}

func tcpFD(conn *net.TCPConn) (uintptr, error) {
	f, err := conn.File()
	if err != nil {
		return 0, err
	}

	return f.Fd(), nil
}
