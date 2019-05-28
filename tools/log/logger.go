package log

import (
	"io"
	"log"
	"os"
)

// Logger represents simple logging object
// calls underlying golang Logger write
// Logger implements io.Writer interface - default behavior - write to out with default prefix
type Logger struct {
	out    *log.Logger
	prefix string // default prefix
	debug  bool
}

// New returns logger object associated with out and error writers
// by default - os.Stdout will be used
func New(out io.Writer, prefix string) *Logger {
	if out == nil {
		out = os.Stdout
	}

	return &Logger{
		out:    log.New(out, prefix, log.LstdFlags),
		prefix: prefix,
		debug:  false,
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

// Write implements io.Writer interface
func (l *Logger) Write(data []byte) (int, error) {
	l.out.SetPrefix(l.prefix)
	l.out.Printf("%s", data)
	return len(data), nil
}

func (l *Logger) SetDebug(debug bool) {
	l.debug = debug
}

func (l *Logger) Debug(args ...interface{}) {
	if l.debug {
		l.out.SetPrefix(DebugPrefix)
		l.out.Print(args...)
	}
}

func (l *Logger) Debugf(fmt string, args ...interface{}) {
	if l.debug {
		l.out.SetPrefix(DebugPrefix)
		l.out.Printf(fmt+"\n", args...)
	}
}

func (l *Logger) Error(args ...interface{}) {
	l.out.SetPrefix(ErrorPrefix)
	l.out.Print(args...)
}

func (l *Logger) Errorf(fmt string, args ...interface{}) {
	l.out.SetPrefix(ErrorPrefix)
	l.out.Printf(fmt+"\n", args...)
}

func (l *Logger) Info(args ...interface{}) {
	l.out.SetPrefix(InfoPrefix)
	l.out.Print(args...)
}

func (l *Logger) Infof(fmt string, args ...interface{}) {
	l.out.SetPrefix(InfoPrefix)
	l.out.Printf(fmt+"\n", args...)
}

func (l *Logger) Warn(args ...interface{}) {
	l.out.SetPrefix(WarningPrefix)
	l.out.Print(args...)
}

func (l *Logger) Warnf(fmt string, args ...interface{}) {
	l.out.SetPrefix(WarningPrefix)
	l.out.Printf(fmt+"\n", args...)
}
