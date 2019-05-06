package authentication

import (
	"fmt"
	"net/http"
	"reflect"
	"testing"
)

func TestCookie(t *testing.T) {
	marker := Marker([]byte{
		118, 57, 234, 139, 251, 103, 238, 139, 19, 69, 146, 75, 24, 180,
		187, 75, 85, 30, 112, 248, 87, 107, 69, 27, 220, 163, 243, 186,
		124, 206, 156, 209, 136, 20, 249, 229, 236, 196, 189,
	})
	hex := "7639ea8bfb67ee8b1345924b18b4bb4b551e70f8576b451bdca3f3ba7cce9cd18814f9e5ecc4bd"

	t.Run("ToCookie", func(t *testing.T) {
		tableTests := []struct {
			i int
			s string
		}{
			{0, "X-Bmp-Auth-Marker-0=7639ea8bfb67ee8b1345924b18b4bb4b551e70f8576b451bdca3f3ba7cce9cd18814f9e5ecc4bd; HttpOnly; Secure; SameSite=Strict"},
			{1, "X-Bmp-Auth-Marker-1=7639ea8bfb67ee8b1345924b18b4bb4b551e70f8576b451bdca3f3ba7cce9cd18814f9e5ecc4bd; HttpOnly; Secure; SameSite=Strict"},
			{10, "X-Bmp-Auth-Marker-10=7639ea8bfb67ee8b1345924b18b4bb4b551e70f8576b451bdca3f3ba7cce9cd18814f9e5ecc4bd; HttpOnly; Secure; SameSite=Strict"},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				if s := marker.ToCookie(tt.i).String(); s != tt.s {
					t.Fatalf("Expected %q, got %q", tt.s, s)
				}
			})
		}
	})

	t.Run("MarkerFromCookie", func(t *testing.T) {
		tableTests := []struct {
			cookie *http.Cookie
			i      int
			marker Marker
		}{
			{nil, 0, nil},
			{&http.Cookie{Name: "foobar"}, 0, nil},            // wrong name
			{&http.Cookie{Name: "X-Bmp-Auth-Marker"}, 0, nil}, // empty value

			{&http.Cookie{Name: "X-Bmp-Auth-Marker", Value: hex}, 0, nil},      // name without index
			{&http.Cookie{Name: "X-Bmp-Auth-Marker-ss", Value: hex}, 0, nil},   // name index is not a int
			{&http.Cookie{Name: "X-Bmp-Auth-SHMarker-10", Value: hex}, 0, nil}, //invalid prefix

			{&http.Cookie{Name: "X-Bmp-Auth-Marker-10", Value: hex}, 10, marker}, // wright
			{&http.Cookie{Name: "X-Bmp-Auth-Marker-0", Value: hex}, 0, marker},   // wright
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				i, marker := MarkerFromCookie(tt.cookie)
				if i != tt.i {
					t.Fatalf("Expected %q, got %q", tt.i, i)
				}
				if !reflect.DeepEqual(marker, tt.marker) {
					t.Fatalf("Expected %q, got %q", tt.marker, marker)
				}
			})
		}
	})

	t.Run("MarkersFromCookies", func(t *testing.T) {
		tableTests := []struct {
			cookies []*http.Cookie
			markers []Marker
		}{
			{nil, nil},
			{[]*http.Cookie{nil, nil}, nil},
			{[]*http.Cookie{&http.Cookie{Name: "foobar"}, nil}, nil},

			{[]*http.Cookie{
				&http.Cookie{Name: "foobar"},
				&http.Cookie{Name: "X-Bmp-Auth-Marker-10", Value: hex},
			}, []Marker{
				marker,
			}},

			// complex case
			{[]*http.Cookie{
				&http.Cookie{Name: "X-Bmp-Auth-Marker-10", Value: "7468697264"}, // third
				&http.Cookie{Name: "foobar"},
				&http.Cookie{Name: "X-Bmp-Auth-Marker-11", Value: "666f75727468"}, // fourth
				&http.Cookie{Name: "foobar2"},
				&http.Cookie{Name: "X-Bmp-Auth-Marker-3", Value: "7365636f6e64"}, // second
				&http.Cookie{Name: "X-Bmp-Auth-Marker-0", Value: "6669727374"},   // first
			}, []Marker{
				[]byte("first"),
				[]byte("second"),
				[]byte("third"),
				[]byte("fourth"),
			}},
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

	t.Run("MarkersDiff", func(t *testing.T) {
		var m1 Marker = []byte("first")  // hex: 6669727374
		var m2 Marker = []byte("second") // hex: 7365636f6e64
		var m3 Marker = []byte("third")  // hex: 7468697264
		var m4 Marker = []byte("fourth") // hex: 666f75727468

		tableTests := []struct {
			from []Marker
			to   []Marker
			ss   []string // string representation of cookies
		}{
			{nil, nil, nil},
			// from is longer
			{
				[]Marker{m1, m2, m3},
				[]Marker{m1},
				[]string{
					"X-Bmp-Auth-Marker-1=7365636f6e64; Max-Age=0; HttpOnly; Secure; SameSite=Strict", // marker was deleted, expire cookie
					"X-Bmp-Auth-Marker-2=7468697264; Max-Age=0; HttpOnly; Secure; SameSite=Strict",   // marker was deleted, expire cookie
				},
			},
			// from is shorter
			{
				[]Marker{m1},
				[]Marker{m1, m2, m3},
				[]string{
					"X-Bmp-Auth-Marker-1=7365636f6e64; HttpOnly; Secure; SameSite=Strict", // marker was added, set cookie
					"X-Bmp-Auth-Marker-2=7468697264; HttpOnly; Secure; SameSite=Strict",   // marker was added, set cookie
				},
			},
			// len equal, values equal
			{[]Marker{m1, m2}, []Marker{m1, m2}, nil},
			// len equal, values different
			{
				[]Marker{m2, m1},
				[]Marker{m3, m4},
				[]string{
					"X-Bmp-Auth-Marker-0=7468697264; HttpOnly; Secure; SameSite=Strict",   // m2 -> m3
					"X-Bmp-Auth-Marker-1=666f75727468; HttpOnly; Secure; SameSite=Strict", // m1 -> m4
				},
			},
			// complex case
			{
				[]Marker{m1, m2, m3, m4},
				[]Marker{m4, m2},
				[]string{
					"X-Bmp-Auth-Marker-0=666f75727468; HttpOnly; Secure; SameSite=Strict",            // m1 -> m4
					"X-Bmp-Auth-Marker-2=7468697264; Max-Age=0; HttpOnly; Secure; SameSite=Strict",   // m3 was deleted
					"X-Bmp-Auth-Marker-3=666f75727468; Max-Age=0; HttpOnly; Secure; SameSite=Strict", // m4 was deleted
				},
			},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				cookies := MarkersDiff(tt.from, tt.to)

				// prepare cookies as string
				var ss []string
				if cookies != nil {
					ss = make([]string, len(cookies))
					for i, cookie := range cookies {
						ss[i] = cookie.String()
					}
				}

				// compare
				if !reflect.DeepEqual(ss, tt.ss) {
					t.Fatalf("Expected %q, got %q", tt.ss, ss)
				}
			})
		}
	})
}
