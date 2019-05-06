package authentication

import (
	"bytes"
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

	// sort markers by i
	sort.Sort(collection)

	// Phase 2. get markers from ordered collection
	markers := make([]Marker, len(collection))

	for i, item := range collection {
		markers[i] = item.marker
	}

	return markers
}

// MarkersDiff calculates difference between two markers set.
// Returns actual cookies
func MarkersDiff(from, to []Marker) []*http.Cookie {
	lfrom := len(from)
	lto := len(to)

	max := lto // set initial max iteration loop
	if lfrom > lto {
		max = lfrom
	}

	// empty markers provided, nothing to do
	if max == 0 {
		return nil
	}

	cookies := make([]*http.Cookie, 0)

	// iterate over biggest collection (because we must catch all actions with markers)
	for i := 0; i < max; i++ {
		var cookie *http.Cookie

		switch {
		case lfrom >= i+1 && lto >= i+1:
			// the marker is still relevant (update or do nothing)
			if !bytes.Equal(from[i], to[i]) {
				// set update cookie
				cookie = to[i].ToCookie(i)
			}
		case lto >= i+1:
			// the marker is new
			cookie = to[i].ToCookie(i)
		case lfrom >= i+1:
			// the marker was deleted
			cookie = from[i].ToCookie(i)
			// set the cookie expired
			cookie.MaxAge = -1
		}

		// append cookie in any way
		if cookie != nil {
			cookies = append(cookies, cookie)
		}
	}

	if len(cookies) == 0 {
		return nil
	}

	return cookies
}
