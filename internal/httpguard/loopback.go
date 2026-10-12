package httpguard

import (
	"net"
	"net/http"
)

// Loopback also checks Host to prevent DNS rebinding against a local service.
func Loopback(origins []string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		host, _, err := net.SplitHostPort(r.Host)
		ip := net.ParseIP(host)
		if err != nil || (host != "localhost" && (ip == nil || !ip.IsLoopback())) {
			JSON(w, 403, map[string]string{"error": "local print bridge host not allowed"})
			return
		}
		if r.Method == "OPTIONS" && r.Header.Get("Access-Control-Request-Private-Network") == "true" {
			for _, origin := range origins {
				if origin != "" && r.Header.Get("Origin") == origin {
					w.Header().Set("Access-Control-Allow-Private-Network", "true")
				}
			}
		}
		next.ServeHTTP(w, r)
	})
}
