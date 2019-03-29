package log

import (
	"io"
	"log"
	"os"
	// "sync"
)

// Logger represents simple logging object
// calls underlying golang Logger write
// Logger implements io.Writer interface - default behavior - write to out part
// Logger implements io.Closer interface - default behavior - close associated resources
type Logger struct {
	// mu    sync.Mutex // ensures atomic writes; protects the following fields
	out   *log.Logger
	err   *log.Logger
	debug bool
}

// NewLogger returns logger object associated with out and error writers
// by default - os.Stdout and os.Stderr will be used
func NewLogger(out, err io.Writer) *Logger {
	if out == nil {
		out = os.Stdout
	}

	if err == nil {
		err = os.Stderr
	}

	return &Logger{
		out:   log.New(out, "", log.LstdFlags),
		err:   log.New(err, "", log.LstdFlags),
		debug: false,
	}
}

// // ToFile returns logger associated with file
// // NOTE: both out and err writers is the same file
// func ToFile(path string) (*Logger, error) {
// 	// // check directory exists, otherwise create it
// 	// dir := filepath.Dir(path)
// 	// if _, err := os.Stat(dir); err != nil {
// 	// 	if os.IsNotExist(err) {
// 	// 		// not exists -> create dir
// 	// 		if err := os.MkdirAll(dir, os.ModePerm); err != nil {
// 	// 			return nil, err
// 	// 		}
// 	// 	} else {
// 	// 		// some unexpected error from stat
// 	// 		return nil, err
// 	// 	}
// 	// }
//
// 	// directory exists - create file
// 	f, err := os.Create(path)
// 	if err != nil {
// 		// error while creating file
// 		return nil, err
// 	}
//
// 	return NewLogger(f, f), nil
// }

// Close implements io.Closer interface
// func (l *Logger) Close() error {
// 	return nil
// }
//
// // Write implements io.Writer interface
// func (l *Logger) Write(p []byte) (int, error) {
// 	l.Info(p)
// 	return len(p), nil
// }

func (l *Logger) SetDebug(debug bool) {
	l.debug = debug
}

func (l *Logger) Debug(args ...interface{}) {
	if l.debug {
		l.err.SetPrefix(debugPrefix)
		l.err.Print(args...)
	}
}

func (l *Logger) Debugf(fmtString string, args ...interface{}) {
	if l.debug {
		l.err.SetPrefix(debugPrefix)
		l.err.Printf(fmtString+"\n", args...)
	}
}

func (l *Logger) Error(args ...interface{}) {
	l.err.SetPrefix(errorPrefix)
	l.err.Print(args...)
}

func (l *Logger) Errorf(fmtString string, args ...interface{}) {
	l.err.SetPrefix(errorPrefix)
	l.err.Printf(fmtString+"\n", args...)
}

func (l *Logger) Info(args ...interface{}) {
	l.out.SetPrefix(infoPrefix)
	l.out.Print(args...)
}

func (l *Logger) Infof(fmtString string, args ...interface{}) {
	l.out.SetPrefix(infoPrefix)
	l.out.Printf(fmtString+"\n", args...)
}

func (l *Logger) Warn(args ...interface{}) {
	l.err.SetPrefix(warningPrefix)
	l.err.Print(args...)
}

func (l *Logger) Warnf(fmtString string, args ...interface{}) {
	l.err.SetPrefix(warningPrefix)
	l.err.Printf(fmtString+"\n", args...)
}
