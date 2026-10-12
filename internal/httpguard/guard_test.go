package httpguard

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestOriginAndAuth(t *testing.T) {
	token := "abcdefghijklmnopqrstuvwxyz123456"
	h := Protect(token, []string{"https://allowed.example"}, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(200) }))
	for _, c := range []struct {
		origin, auth string
		status       int
	}{{"https://evil.example", token, 403}, {"https://allowed.example", "bad", 401}, {"https://allowed.example", token, 200}} {
		r := httptest.NewRequest("GET", "http://localhost/v1/printers", nil)
		r.Header.Set("Origin", c.origin)
		r.Header.Set("Authorization", "Bearer "+c.auth)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		if w.Code != c.status {
			t.Fatalf("got %d want %d", w.Code, c.status)
		}
	}
}
