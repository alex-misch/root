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

	// expected cookie
	expected := &http.Cookie{
		Name:     "X-Bmp-Auth",
		Value:    hex,
		HttpOnly: true,
	}

	t.Run("ToCookie", func(t *testing.T) {
		if cookie := marker.ToCookie(); !reflect.DeepEqual(cookie, expected) {
			t.Fatalf("Expected %q, got %q", expected, cookie)
		}
	})

	t.Run("MarkerFromCookie", func(t *testing.T) {
		tableTests := []struct {
			cookie *http.Cookie
			marker Marker
			err    error
		}{
			{nil, nil, ErrWrongCookie},
			{&http.Cookie{Name: "foobar"}, nil, ErrWrongCookie},
			{&http.Cookie{Name: "X-Bmp-Auth"}, nil, ErrWrongCookie},
			{&http.Cookie{Name: "X-Bmp-Auth", HttpOnly: true}, nil, ErrWrongCookie},
			{&http.Cookie{Name: "X-Bmp-Auth", HttpOnly: true, Value: "48656c6c6f20476f7068657221"}, Marker([]byte("Hello Gopher!")), nil},
			{&http.Cookie{Name: "X-Bmp-Auth", HttpOnly: true, Value: hex}, marker, nil},
		}

		for i, tt := range tableTests {
			t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
				marker, err := MarkerFromCookie(tt.cookie)
				if !reflect.DeepEqual(err, tt.err) {
					t.Fatalf("Expected %q, got %q", tt.err, err)
				}
				if !reflect.DeepEqual(marker, tt.marker) {
					t.Fatalf("Expected %q, got %q", tt.marker, marker)
				}
			})
		}
	})
}
