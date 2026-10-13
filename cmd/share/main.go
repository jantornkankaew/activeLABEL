// Standalone durable short-link service. Does not expose AI or print endpoints.
package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

const target = "https://jantornkankaew.github.io/labelcraft/"

var idPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{12}$`)

type service struct {
	dir, base string
	mu        sync.Mutex
	window    time.Time
	count     int
}

func (s *service) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Referrer-Policy", "no-referrer")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	if r.URL.Path == "/healthz" {
		w.WriteHeader(200)
		return
	}
	if r.Method == "GET" && strings.HasPrefix(r.URL.Path, "/s/") {
		id := strings.TrimPrefix(r.URL.Path, "/s/")
		if !idPattern.MatchString(id) {
			http.NotFound(w, r)
			return
		}
		b, e := os.ReadFile(filepath.Join(s.dir, id))
		if e != nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		http.Redirect(w, r, string(b), http.StatusFound)
		return
	}
	if r.URL.Path != "/v1/links" {
		http.NotFound(w, r)
		return
	}
	if r.Header.Get("Origin") != "https://jantornkankaew.github.io" {
		http.Error(w, "origin not allowed", 403)
		return
	}
	w.Header().Set("Access-Control-Allow-Origin", "https://jantornkankaew.github.io")
	w.Header().Set("Vary", "Origin")
	if r.Method == "OPTIONS" {
		w.Header().Set("Access-Control-Allow-Methods", "POST")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(204)
		return
	}
	if r.Method != "POST" {
		w.WriteHeader(405)
		return
	}
	var input struct {
		URL string `json:"url"`
	}
	d := json.NewDecoder(http.MaxBytesReader(w, r.Body, 17000))
	d.DisallowUnknownFields()
	if d.Decode(&input) != nil || d.Decode(new(any)) != io.EOF || len(input.URL) > 16000 || !strings.HasPrefix(input.URL, target+"#share=") {
		http.Error(w, "invalid label link", 400)
		return
	}
	parsed, e := url.Parse(input.URL)
	if e != nil || parsed.Scheme != "https" || parsed.Host != "jantornkankaew.github.io" || parsed.Path != "/labelcraft/" || parsed.RawQuery != "" || parsed.User != nil {
		http.Error(w, "invalid destination", 400)
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if time.Since(s.window) > time.Minute {
		s.window = time.Now()
		s.count = 0
	}
	if s.count >= 60 {
		http.Error(w, "try again later", 429)
		return
	}
	s.count++
	files, e := os.ReadDir(s.dir)
	if e != nil {
		http.Error(w, "storage unavailable", 503)
		return
	}
	if len(files) >= 10000 {
		http.Error(w, "storage full", 507)
		return
	}
	secret := make([]byte, 9)
	if _, e = rand.Read(secret); e != nil {
		http.Error(w, "unavailable", 503)
		return
	}
	id := base64.RawURLEncoding.EncodeToString(secret)
	f, e := os.OpenFile(filepath.Join(s.dir, id), os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if e != nil {
		http.Error(w, "storage unavailable", 503)
		return
	}
	_, e = io.WriteString(f, input.URL)
	closeErr := f.Close()
	if e != nil || closeErr != nil {
		os.Remove(filepath.Join(s.dir, id))
		http.Error(w, "storage unavailable", 503)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)
	json.NewEncoder(w).Encode(map[string]string{"url": s.base + "/s/" + id})
}
func main() {
	base := strings.TrimRight(os.Getenv("SHARE_PUBLIC_URL"), "/")
	u, e := url.Parse(base)
	if e != nil || u.Scheme != "https" || u.Host == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" {
		log.Fatal("Set SHARE_PUBLIC_URL to the public HTTPS service address")
	}
	dir := os.Getenv("SHARE_DATA_DIR")
	if dir == "" {
		log.Fatal("Set SHARE_DATA_DIR to a persistent mounted directory")
	}
	if e = os.MkdirAll(dir, 0700); e != nil {
		log.Fatal("share storage unavailable")
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	server := http.Server{Addr: ":" + port, Handler: &service{dir: dir, base: base}, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second, IdleTimeout: 30 * time.Second}
	log.Fatal(server.ListenAndServe())
}
