package authentication

import (
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/boomfunc/root/guard/trust"
)

const (
	CookieNamePrefix = "X-Bmp-Auth-Marker-"
)

// Marker is token
// means that the user finished some challenge
type Marker []byte

// NewMarker creates new token
// that is the representation of trust relation between
// somebody who tries to authenticate and the challenge he has done
func NewMarker(from, to trust.Node) (Marker, error) {
	return trust.Create(from, to)
}

// MarkerFromCookie returns marker from http cookie value
// returns marker and index
// if marker == nil means cookie invalid
func MarkerFromCookie(cookie *http.Cookie) (int, Marker) {
	// cookie itsef pointer to nil
	if cookie == nil {
		return 0, nil
	}

	// invalid cookie name (some another cookie)
	if !strings.HasPrefix(cookie.Name, CookieNamePrefix) {
		return 0, nil
	}

	// parse name and get index
	i, err := strconv.Atoi(strings.TrimPrefix(cookie.Name, CookieNamePrefix))
	if err != nil {
		return 0, nil
	}

	// empty marker - invalid
	if cookie.Value == "" {
		return 0, nil
	}

	// not a hex string
	b, err := hex.DecodeString(cookie.Value)
	if err != nil {
		return 0, nil
	}

	// get index from name and return with value
	return i, b
}

// ToCookie helper function for sending marker throw http application layer
func (m Marker) ToCookie(i int) *http.Cookie {
	return &http.Cookie{
		Name:     fmt.Sprintf("%s%d", CookieNamePrefix, i),
		Value:    hex.EncodeToString(m),
		HttpOnly: true,                    // no access through browser API (https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting)
		Secure:   true,                    // cookie transmitted over HTTPS only
		SameSite: http.SameSiteStrictMode, // https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00
	}
}
