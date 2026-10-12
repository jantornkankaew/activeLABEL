package httpguard

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestLocalPrinterHostAndPrivateNetworkGuards(t *testing.T) {
	token := strings.Repeat("t", 32)
	origin := "https://jantornkankaew.github.io"
	handler := Loopback([]string{origin}, Protect(token, []string{origin}, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(200) })))
	for _, test := range []struct {
		host, origin, method, token string
		want                        int
		private                     bool
	}{
		{"localhost:28171", origin, "GET", token, 200, false}, {"127.0.0.1:28171", origin, "GET", token, 200, false}, {"evil.example:28171", origin, "GET", token, 403, false}, {"localhost:28171", "https://evil.example", "GET", token, 403, false}, {"localhost:28171", origin, "GET", "", 401, false}, {"localhost:28171", origin, "OPTIONS", "", 204, true}, {"localhost:28171", "https://evil.example", "OPTIONS", "", 403, false},
	} {
		r := httptest.NewRequest(test.method, "http://localhost:28171/v1/printers", nil)
		r.Host = test.host
		r.Header.Set("Origin", test.origin)
		r.Header.Set("Authorization", "Bearer "+test.token)
		r.Header.Set("Access-Control-Request-Private-Network", "true")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, r)
		if w.Code != test.want {
			t.Errorf("%s %s: %d", test.host, test.origin, w.Code)
		}
		if (w.Header().Get("Access-Control-Allow-Private-Network") == "true") != test.private {
			t.Errorf("unexpected private-network permission for %s %s", test.host, test.origin)
		}
	}
}
