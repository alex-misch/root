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
		HttpOnly: true,                    // no access through browser API (https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting)
		Secure:   true,                    // cookie transmitted over HTTPS only
		SameSite: http.SameSiteStrictMode, // https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00
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
