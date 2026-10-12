package httpguard

import (
	"crypto/subtle"
	"encoding/json"
	"net/http"
	"strings"
)

func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
func Protect(token string, origins []string, next http.Handler) http.Handler {
	allowed := map[string]bool{}
	for _, o := range origins {
		allowed[o] = true
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		origin := r.Header.Get("Origin")
		if origin != "" && !allowed[origin] {
			JSON(w, 403, map[string]string{"error": "origin not allowed"})
			return
		}
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		}
		if r.Method == "OPTIONS" {
			w.WriteHeader(204)
			return
		}
		value := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		if len(token) < 24 || subtle.ConstantTimeCompare([]byte(value), []byte(token)) != 1 {
			JSON(w, 401, map[string]string{"error": "unauthorized"})
			return
		}
		next.ServeHTTP(w, r)
	})
}
