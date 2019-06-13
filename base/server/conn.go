package server

import (
	"io"
	"os"
	"sync"
	"syscall"
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

func (conn *Conn) Read(p []byte) (int, error)  { return conn.rwc.Read(p) }  // Just a proxy method.
func (conn *Conn) Write(p []byte) (int, error) { return conn.rwc.Write(p) } // Just a proxy method.

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
