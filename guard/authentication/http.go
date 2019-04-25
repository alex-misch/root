package authentication

import (
	"encoding/hex"
	"errors"
	"net/http"
)

var (
	CookieName     = "X-Bmp-Auth"
	ErrWrongCookie = errors.New("guard/authentication: Wrong `cookie` provided")
)

// ToCookie helper function for sending marker throw http application layer
func (m Marker) ToCookie() *http.Cookie {
	return &http.Cookie{
		Name:     CookieName,
		Value:    hex.EncodeToString(m),
		HttpOnly: true,
	}
}

// MarkerFromCookie returns makrer from http cookie value
func MarkerFromCookie(cookie *http.Cookie) (Marker, error) {
	if cookie == nil {
		return nil, ErrWrongCookie
	}

	if cookie.Name != CookieName {
		return nil, ErrWrongCookie
	}

	if !cookie.HttpOnly {
		return nil, ErrWrongCookie
	}

	if cookie.Value == "" {
		return nil, ErrWrongCookie
	}

	return hex.DecodeString(cookie.Value)
}
