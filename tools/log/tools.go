package log

import (
	"fmt"
	"strconv"
	"strings"
)

const modChar = "\x1b"

type Modification int
type Modifications []Modification

func (ms Modifications) String() string {
	toString := make([]string, len(ms))

	for i, v := range ms {
		toString[i] = strconv.Itoa(int(v))
	}

	return fmt.Sprintf("%s[%sm", modChar, strings.Join(toString, ";"))
}

const (
	// Common attributes [0, 1, 2, 4, 5, 7]
	Default Modification = iota
	Bold
	SemiBright
	_
	UnderLine
	Blink
	_
	Reversion
)

const (
	// Char colors [30-37]
	BlackChar Modification = iota + 30
	RedChar
	GreenChar
	YellowChar
	BlueChar
	PurpleChar
	AquamarineChar
	GrayChar
)

const (
	// Background colors [40-47]
	BlackBackground Modification = iota + 40
	RedBackground
	GreenBackground
	YellowBackground
	BlueBackground
	PurpleBackground
	AquamarineBackground
	GrayBackground
)

// colors and modes
// https://habrahabr.ru/post/119436/
// https://misc.flogisoft.com/bash/tip_colors_and_formatting
// TODO play with this https://stackoverflow.com/questions/28432398/difference-between-some-operators-golang
func Wrap(v interface{}, mods ...Modification) string {
	// no modifications
	if mods == nil {
		return fmt.Sprint(v)
	}
	// calculate wrappers (opening and closing)
	openingWrapper := Modifications(mods).String()
	closingWrapper := Modifications([]Modification{Default}).String()
	// concat
	return openingWrapper + fmt.Sprint(v) + closingWrapper
}

// just shortcuts
var (
	debugPrefix   = Wrap("[DEBUG]", Bold, GrayChar) + "\t"
	errorPrefix   = Wrap("[ERROR]", Bold, RedChar, Blink) + "\t"
	infoPrefix    = Wrap("[INFO]", Bold, GreenChar) + "\t"
	warningPrefix = Wrap("[WARN]", Bold, YellowChar, Blink) + "\t"
)
