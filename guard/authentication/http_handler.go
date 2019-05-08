package authentication

import (
	"fmt"
	"net/http"
)

// ServeHTTP imaplements http.Handler interface
func (t *tournament) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// get current auth state
	old := MarkersFromCookies(r.Cookies())

	// cookie handler
	auth := func(new []Marker) {
		for _, cookie := range MarkersDiff(old, new) {
			http.SetCookie(w, cookie)
		}
	}

	// request action based on authenticated state
	if r.Method == "GET" {
		// ask
		markers, err := t.Ask(old)
		auth(markers)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Handler action - render form
		fmt.Fprint(w, "<h1>SIGN IN</h1>"+
			"<form method=\"POST\">"+
			"<textarea name=\"answer\"></textarea><br>"+
			"<input type=\"submit\" value=\"Save\">"+
			"</form>")

	} else {
		// get value from form
		if err := r.ParseForm(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// answer
		markers, err := t.Answer(old, []byte(r.PostFormValue("answer")))
		auth(markers)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Handler action - redirect to next round
		http.Redirect(w, r, "/signin", http.StatusFound)
	}
}
