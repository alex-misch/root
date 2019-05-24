package log

import (
	"fmt"
	"testing"
)

func TestModificationsString(t *testing.T) {
	tableTests := []struct {
		ms             Modifications // modification list
		expectedString string        // string representation
	}{
		{Modifications{1, 2, 31, 35}, "\x1b[1;2;31;35m"},                             // some hardcoded
		{Modifications{Default}, "\x1b[0m"},                                          // closing wrapper
		{Modifications{Bold, SemiBright, RedChar, RedBackground}, "\x1b[1;2;31;41m"}, // some set via variables
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if msString := tt.ms.String(); msString != tt.expectedString {
				t.Errorf("Expected %q, got %q", tt.expectedString, msString)
			}
		})
	}
}

// look to join this and next func
func TestWrap(t *testing.T) {
	tableTests := []struct {
		s       string        // string to wrap
		ms      Modifications // modifications
		wrapped string        // wrapped
	}{
		{"foo", nil, "foo"}, // no modifactions
		{"bar", Modifications{Bold, AquamarineChar, Blink, YellowBackground}, "\x1b[1;36;5;43mbar\x1b[0m"}, // some set of mods
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if wrapped := Wrap(tt.s, tt.ms...); wrapped != tt.wrapped {
				t.Errorf("Expected %q, got %q", tt.wrapped, wrapped)
			}
		})
	}
}

func TestWrapShortcuts(t *testing.T) {
	tableTests := []struct {
		shortcut string // shortcut for wrapping
		expected string // wrapped
	}{
		{DebugPrefix, "\x1b[1;37m[DEBUG]\x1b[0m\t"},
		{ErrorPrefix, "\x1b[1;31;5m[ERROR]\x1b[0m\t"},
		{InfoPrefix, "\x1b[1;32m[INFO]\x1b[0m\t"},
		{WarningPrefix, "\x1b[1;33;5m[WARN]\x1b[0m\t"},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if tt.shortcut != tt.expected {
				t.Errorf("Expected %q, got %q", tt.expected, tt.shortcut)
			}
		})
	}
}
