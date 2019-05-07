package authentication

import (
	"fmt"
	"net/http"
)

// ServeHTTP imaplements http.Handler interface
func (t *tournament) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// get current auth state
	var oldMarkers = MarkersFromCookies(r.Cookies())
	var newMarkers []Marker

	// request action based on authenticated state
	if r.Method == "GET" {
		// ask
		markers, err := t.Ask(oldMarkers)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		newMarkers = markers
	} else {
		// get value from form
		if err := r.ParseForm(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// answer
		markers, err := t.Answer(oldMarkers, []byte(r.PostFormValue("answer")))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		newMarkers = markers
	}

	// next round
	// update authentication cookies
	for _, cookie := range MarkersDiff(oldMarkers, newMarkers) {
		http.SetCookie(w, cookie)
	}

	// render form
	fmt.Fprint(w, "<h1>SIGN IN</h1>"+
		"<form method=\"POST\">"+
		"<textarea name=\"answer\"></textarea><br>"+
		"<input type=\"submit\" value=\"Save\">"+
		"</form>")
}
