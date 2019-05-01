package authentication

import (
	"encoding/hex"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
)

var (
	CookieNamePrefix = "X-Bmp-Auth-Marker-"
)

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

// MarkersFromCookies returns markers from request cookies
// NOTE: markers will be sorted and filtered
// no care about cookie ordering from net/http package
func MarkersFromCookies(cookies []*http.Cookie) []Marker {
	// Prephase. Checks
	if len(cookies) == 0 {
		return nil
	}

	// Phase 1. generate collection
	collection := make(Markers, 0)

	for _, cookie := range cookies {
		if i, marker := MarkerFromCookie(cookie); marker != nil {
			// add marker to sorting collection
			collection = append(collection, mitem{marker, i})
		}
	}

	if len(collection) == 0 {
		return nil
	}

	sort.Sort(collection)

	// Phase 2. get markers from ordered collection
	markers := make([]Marker, len(collection))

	for i, item := range collection {
		markers[i] = item.marker
	}

	return markers
}
