package authentication

import (
	"fmt"
	"net/http"
	"reflect"
	"testing"
)

func TestMarker(t *testing.T) {
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
}
