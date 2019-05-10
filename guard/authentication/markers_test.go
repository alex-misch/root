package authentication

import (
	"fmt"
	"net/http"
	"reflect"
	"testing"
)

// in is the helper function does string in list (used for comparing slices with unexpecting ordering)
func in(s string, ss []string) bool {
	for _, b := range ss {
		if b == s {
			return true
		}
	}
	return false
}

func TestMarkers(t *testing.T) {
	var m1 Marker = []byte("first")  // hex: 6669727374
	var m2 Marker = []byte("second") // hex: 7365636f6e64
	var m3 Marker = []byte("third")  // hex: 7468697264
	var m4 Marker = []byte("fourth") // hex: 666f75727468
	var m5 Marker = []byte{
		118, 57, 234, 139, 251, 103, 238, 139, 19, 69, 146, 75, 24, 180,
		187, 75, 85, 30, 112, 248, 87, 107, 69, 27, 220, 163, 243, 186,
		124, 206, 156, 209, 136, 20, 249, 229, 236, 196, 189,
	}
	hex := "7639ea8bfb67ee8b1345924b18b4bb4b551e70f8576b451bdca3f3ba7cce9cd18814f9e5ecc4bd"

	t.Run("MarkersFromSlice", func(t *testing.T) {
		tableTests := []struct {
			markers    []Marker
			collection Markers
		}{
			{nil, nil},
			{[]Marker(nil), nil},
			{[]Marker{}, nil},

			{[]Marker{m1, m2, m3, m4}, Markers{0: m1, 1: m2, 2: m3, 3: m4}},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if collection := MarkersFromSlice(tt.markers); !reflect.DeepEqual(collection, tt.collection) {
					t.Fatalf("Expected %q, got %q", tt.collection, collection)
				}
			})
		}
	})

	t.Run("MarkersFromCookies", func(t *testing.T) {
		tableTests := []struct {
			cookies []*http.Cookie
			markers Markers
		}{
			{nil, nil},
			{[]*http.Cookie{nil, nil}, nil},
			{[]*http.Cookie{&http.Cookie{Name: "foobar"}, nil}, nil},

			{[]*http.Cookie{
				&http.Cookie{Name: "foobar"},
				&http.Cookie{Name: "X-Bmp-Auth-Marker-10", Value: hex},
			}, Markers{10: m5}},

			// complex case
			{[]*http.Cookie{
				&http.Cookie{Name: "X-Bmp-Auth-Marker-10", Value: "7468697264"}, // third
				&http.Cookie{Name: "foobar"},
				&http.Cookie{Name: "X-Bmp-Auth-Marker-11", Value: "666f75727468"}, // fourth
				&http.Cookie{Name: "foobar2"},
				&http.Cookie{Name: "X-Bmp-Auth-Marker-3", Value: "7365636f6e64"}, // second
				&http.Cookie{Name: "X-Bmp-Auth-Marker-0", Value: "6669727374"},   // first
			}, Markers{0: m1, 3: m2, 10: m3, 11: m4}},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				markers := MarkersFromCookies(tt.cookies)
				if !reflect.DeepEqual(markers, tt.markers) {
					t.Fatalf("Expected %q, got %q", tt.markers, markers)
				}
			})
		}
	})

	t.Run("Slice", func(t *testing.T) {
		tableTests := []struct {
			collection Markers
			markers    []Marker
		}{
			{nil, nil},
			{Markers(nil), nil},
			{Markers{}, nil},

			{Markers{3: m1, 8: m2, 0: m3, 100: m4}, []Marker{m3, m1, m2, m4}},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if markers := tt.collection.Slice(); !reflect.DeepEqual(markers, tt.markers) {
					t.Fatalf("Expected %q, got %q", tt.markers, markers)
				}
			})
		}
	})

	t.Run("Diff", func(t *testing.T) {
		tableTests := []struct {
			from Markers
			to   Markers
			ss   []string // string representation of cookies
		}{
			{nil, nil, nil},
			// from is longer
			{
				Markers{0: m1, 1: m2, 2: m3},
				Markers{0: m1},
				[]string{
					"X-Bmp-Auth-Marker-1=7365636f6e64; Max-Age=0; HttpOnly; Secure; SameSite=Strict", // marker was deleted, expire cookie
					"X-Bmp-Auth-Marker-2=7468697264; Max-Age=0; HttpOnly; Secure; SameSite=Strict",   // marker was deleted, expire cookie
				},
			},
			// from is shorter
			{
				Markers{0: m1},
				Markers{0: m1, 1: m2, 2: m3},
				[]string{
					"X-Bmp-Auth-Marker-1=7365636f6e64; HttpOnly; Secure; SameSite=Strict", // marker was added, set cookie
					"X-Bmp-Auth-Marker-2=7468697264; HttpOnly; Secure; SameSite=Strict",   // marker was added, set cookie
				},
			},
			// len equal, values equal
			{Markers{0: m1, 1: m2}, Markers{0: m1, 1: m2}, nil},
			// len equal, values different
			{
				Markers{0: m2, 1: m1},
				Markers{0: m3, 1: m4},
				[]string{
					"X-Bmp-Auth-Marker-0=7468697264; HttpOnly; Secure; SameSite=Strict",   // m2 -> m3
					"X-Bmp-Auth-Marker-1=666f75727468; HttpOnly; Secure; SameSite=Strict", // m1 -> m4
				},
			},
			// complex case
			{
				Markers{0: m1, 1: m2, 2: m3, 3: m4},
				Markers{0: m4, 1: m2},
				[]string{
					"X-Bmp-Auth-Marker-0=666f75727468; HttpOnly; Secure; SameSite=Strict",            // m1 -> m4
					"X-Bmp-Auth-Marker-2=7468697264; Max-Age=0; HttpOnly; Secure; SameSite=Strict",   // m3 was deleted
					"X-Bmp-Auth-Marker-3=666f75727468; Max-Age=0; HttpOnly; Secure; SameSite=Strict", // m4 was deleted
				},
			},
			// case with wrong order
			{
				Markers{10: m2, 20: m3, 30: m4},
				Markers{0: m4, 1: m2},
				[]string{
					"X-Bmp-Auth-Marker-10=7365636f6e64; Max-Age=0; HttpOnly; Secure; SameSite=Strict", // marker with this index was deleted
					"X-Bmp-Auth-Marker-20=7468697264; Max-Age=0; HttpOnly; Secure; SameSite=Strict",   // marker with this index was deleted
					"X-Bmp-Auth-Marker-30=666f75727468; Max-Age=0; HttpOnly; Secure; SameSite=Strict", // marker with this index was deleted
					"X-Bmp-Auth-Marker-0=666f75727468; HttpOnly; Secure; SameSite=Strict",
					"X-Bmp-Auth-Marker-1=7365636f6e64; HttpOnly; Secure; SameSite=Strict",
				},
			},
			// invalidate all (ordering also broken)
			{
				Markers{10: m2, 20: m3, 30: m4},
				nil,
				[]string{
					"X-Bmp-Auth-Marker-10=7365636f6e64; Max-Age=0; HttpOnly; Secure; SameSite=Strict", // marker with this index was deleted
					"X-Bmp-Auth-Marker-20=7468697264; Max-Age=0; HttpOnly; Secure; SameSite=Strict",   // marker with this index was deleted
					"X-Bmp-Auth-Marker-30=666f75727468; Max-Age=0; HttpOnly; Secure; SameSite=Strict", // marker with this index was deleted
				},
			},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				cookies := tt.from.Diff(tt.to)

				// prepare cookies as string
				var ss []string
				if cookies != nil {
					ss = make([]string, len(cookies))
					for i, cookie := range cookies {
						ss[i] = cookie.String()
					}
				}

				// compare cookie values (as strings)
				// NOTE: because we implement set as map - ordering ca be unexpected
				if len(ss) != len(tt.ss) {
					t.Fatalf("cookies len: Expected %q, got %q", len(tt.ss), len(ss))
				}

				for _, s := range tt.ss {
					if !in(s, ss) {
						t.Fatalf("Expected cookie: %q", s)
					}
				}
			})
		}
	})
}
