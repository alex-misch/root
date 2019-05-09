package authentication

import (
	"bytes"
	"net/http"
	"sort"

	"github.com/boomfunc/root/guard/trust"
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

// Markers is the collection of marker
// where key is their index
type Markers map[int]Marker

// MarkersFromSlice creates ordered and indexed collection
// from raw markers slice
func MarkersFromSlice(markers []Marker) Markers {
	// Phephase. Checks
	if markers == nil || len(markers) == 0 {
		return nil
	}

	collection := make(Markers, len(markers))

	for i, marker := range markers {
		collection[i] = marker
	}

	return collection

}

// MarkersFromCookies returns markers from request cookies
// NOTE: markers will be sorted and filtered
// no care about cookie ordering from net/http package
func MarkersFromCookies(cookies []*http.Cookie) Markers {
	// Prephase. Checks
	if len(cookies) == 0 {
		return nil
	}

	// Phase 1. generate collection
	collection := make(Markers, 0)

	for _, cookie := range cookies {
		if i, marker := MarkerFromCookie(cookie); marker != nil {
			// add marker to sorting collection
			collection[i] = marker
		}
	}

	if len(collection) == 0 {
		return nil
	}

	// Phase 2. get markers from ordered collection
	return collection
}

// Diff calculates difference between two markers collections.
// Returns actual cookies for actualizing state from current markers to `to` collection.
// This function is a part of http integration.
func (ms Markers) Diff(to Markers) []*http.Cookie {
	// main idea - iterate over all keys from `ms` and `to`

	// Phase 1. Generate unique set of the keys union
	keys := make(map[int]struct{})
	for k, _ := range ms {
		keys[k] = struct{}{}
	}
	for k, _ := range to {
		keys[k] = struct{}{}
	}

	// Middle phase. Checks
	if len(keys) == 0 {
		return nil
	}

	cookies := make([]*http.Cookie, 0)

	// Phase 2. Iterate over union and detect what happenede with the i's marker
	for k, _ := range keys {
		m1, ok1 := ms[k]
		m2, ok2 := to[k]

		var cookie *http.Cookie

		// iterate over available variants
		switch {
		case ok1 && ok2:
			// the marker is still relevant (update or do nothing)
			if !bytes.Equal(m1, m2) {
				// set update cookie
				cookie = m2.ToCookie(k)
			}
		case !ok1 && ok2:
			// the marker is new
			cookie = m2.ToCookie(k)
		case ok1 && !ok2:
			// the marker was deleted
			cookie = m1.ToCookie(k)
			// set the cookie expired
			cookie.MaxAge = -1
		}

		// append cookie in any way
		if cookie != nil {
			cookies = append(cookies, cookie)
		}
	}

	// Returns generated cookies
	if len(cookies) == 0 {
		return nil
	}

	return cookies
}

// Slice returns ordered by index slice of markers
func (ms Markers) Slice() []Marker {
	// Prephase. Checks
	if ms == nil || len(ms) == 0 {
		return nil
	}

	// Phase 1. Generate ordered keys
	keys := make([]int, 0)
	markers := make([]Marker, len(ms))

	for k, _ := range ms {
		keys = append(keys, k)
	}

	sort.Ints(keys)

	for i, k := range keys {
		markers[i] = ms[k]
	}

	return markers
}
