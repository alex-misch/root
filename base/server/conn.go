package server

import (
	"io"
	"net"
	"os"
	"sync"
	"syscall"
	"time"
)

// filer describes objects with underlying file.
type filer interface {
	File() (*os.File, error)
}

// Conn is the wrapper with modified .Close() method.
// Specially for net.Conn with underlying .File().
type Conn struct {
	rwc   io.ReadWriteCloser // Underlying stream.
	conce sync.Once          // Close method might be invoked only once.
}

// Proxy methods for inplementing the io.ReadWriter interface
func (conn *Conn) Read(p []byte) (int, error)  { return conn.rwc.Read(p) }  // Just a proxy method.
func (conn *Conn) Write(p []byte) (int, error) { return conn.rwc.Write(p) } // Just a proxy method.

// Proxy methods for inplementing the net.Conn interface
func (conn *Conn) LocalAddr() net.Addr                { return conn.rwc.(net.Conn).LocalAddr() }         // Just a proxy method.
func (conn *Conn) RemoteAddr() net.Addr               { return conn.rwc.(net.Conn).RemoteAddr() }        // Just a proxy method.
func (conn *Conn) SetDeadline(t time.Time) error      { return conn.rwc.(net.Conn).SetDeadline(t) }      // Just a proxy method.
func (conn *Conn) SetReadDeadline(t time.Time) error  { return conn.rwc.(net.Conn).SetReadDeadline(t) }  // Just a proxy method.
func (conn *Conn) SetWriteDeadline(t time.Time) error { return conn.rwc.(net.Conn).SetWriteDeadline(t) } // Just a proxy method.

// Close implements the io.Closer interface.
func (conn *Conn) Close() error {
	var err error

	conn.conce.Do(func() {
		err = conn.close()
	})

	return err
}

func (conn *Conn) close() error {
	defer conn.rwc.Close()

	// Can we fetch underlying file?
	c, ok := conn.rwc.(filer)
	if !ok {
		return nil
	}

	// Yes, we can.
	// .File() call `dup` syscall.
	f, err := c.File()
	if err != nil {
		return err
	}

	// Close duplicate of real connection's file descriptor.
	return syscall.Shutdown(int(f.Fd()), syscall.SHUT_RDWR)
}
