package log

import (
	"log"
	"os"
)

type Logger struct {
	out   *log.Logger
	err   *log.Logger
	debug bool
}

func NewLogger() *Logger {
	return &Logger{
		out:   log.New(os.Stdout, "", log.LstdFlags),
		err:   log.New(os.Stderr, "", log.LstdFlags),
		debug: false,
	}
}

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
