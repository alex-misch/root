package log

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"reflect"
	"testing"
)

var buf bytes.Buffer
var l = &Logger{
	out:    log.New(&buf, InfoPrefix, 0), // nil flag for empty datetime prefix
	prefix: InfoPrefix,
}

func TestLoggerSetDebug(t *testing.T) {
	for i, debug := range []bool{true, false} {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if l.SetDebug(debug); l.debug != debug {
				t.Errorf("Expected \"%t\", got \"%t\"", debug, l.debug)
			}
		})
	}
}

func TestLoggerPrint(t *testing.T) {
	tableTests := []struct {
		methodName string        // logger method
		args       []interface{} // args to logger method
		debug      bool          // logger printer debug mode
		output     string        // expected buffer's output
	}{
		{"Error", []interface{}{"errorcode:100500"}, false, "\x1b[1;31;5m[ERROR]\x1b[0m\terrorcode:100500\n"},
		{"Errorf", []interface{}{"FOO%s:%dBAR", "errorcode", 100500}, false, "\x1b[1;31;5m[ERROR]\x1b[0m\tFOOerrorcode:100500BAR\n"},

		{"Info", []interface{}{"infocode:100500"}, false, "\x1b[1;32m[INFO]\x1b[0m\tinfocode:100500\n"},
		{"Infof", []interface{}{"FOO%s:%dBAR", "infocode", 100500}, false, "\x1b[1;32m[INFO]\x1b[0m\tFOOinfocode:100500BAR\n"},

		{"Warn", []interface{}{"warncode:100500"}, false, "\x1b[1;33;5m[WARN]\x1b[0m\twarncode:100500\n"},
		{"Warnf", []interface{}{"FOO%s:%dBAR", "warncode", 100500}, false, "\x1b[1;33;5m[WARN]\x1b[0m\tFOOwarncode:100500BAR\n"},

		{"Debug", []interface{}{"debugcode:100500"}, false, ""},
		{"Debugf", []interface{}{"FOO%s:%dBAR", "debugcode", 100500}, false, ""},

		{"Debug", []interface{}{"debugcode:100500"}, true, "\x1b[1;37m[DEBUG]\x1b[0m\tdebugcode:100500\n"},
		{"Debugf", []interface{}{"FOO%s:%dBAR", "debugcode", 100500}, true, "\x1b[1;37m[DEBUG]\x1b[0m\tFOOdebugcode:100500BAR\n"},
	}

	for i, tt := range tableTests {
		// set mode
		l.SetDebug(tt.debug)
		// prepare and convert to reflect
		method := reflect.ValueOf(l).MethodByName(tt.methodName)
		args := []reflect.Value{}
		for _, a := range tt.args {
			args = append(args, reflect.ValueOf(a))
		}
		// call Logger print method
		method.Call(args)
		// Check buffer output
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if output := buf.String(); output != tt.output {
				t.Errorf("Expected %q, got %q", tt.output, output)
			}
		})
		// reset buffer to future tests
		buf.Reset()
	}
}

func TestLoggerWrite(t *testing.T) {
	tableTests := []struct {
		input  string
		n      int
		err    error
		output string // expected buffer's output
	}{
		{"log event", 9, nil, "\x1b[1;32m[INFO]\x1b[0m\tlog event\n"},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			// imitate writing to logger
			n, err := io.Copy(l, bytes.NewBufferString(tt.input))

			if !reflect.DeepEqual(err, tt.err) {
				t.Fatalf("Expected %q, got %q", tt.err, err)
			}
			if int(n) != tt.n {
				t.Fatalf("Expected %q, got %q", tt.n, n)
			}
			if output := buf.String(); output != tt.output {
				t.Errorf("Expected %q, got %q", tt.output, output)
			}

			// reset buffer to future tests
			buf.Reset()
		})
	}
}
