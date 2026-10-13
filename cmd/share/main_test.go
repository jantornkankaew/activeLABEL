package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func TestDurableShortLinks(t *testing.T) {
	dir := t.TempDir()
	s := &service{dir: dir, base: "https://share.example"}
	call := func(method, path, body, origin string) *httptest.ResponseRecorder {
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		r.Header.Set("Origin", origin)
		w := httptest.NewRecorder()
		s.ServeHTTP(w, r)
		return w
	}
	origin := "https://jantornkankaew.github.io"
	destination := target + "#share=z2.ABCD"
	w := call("POST", "/v1/links", `{"url":"`+destination+`"}`, origin)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	var result map[string]string
	json.Unmarshal(w.Body.Bytes(), &result)
	id := strings.TrimPrefix(result["url"], s.base+"/s/")
	if !idPattern.MatchString(id) {
		t.Fatal(id)
	}
	s = &service{dir: dir, base: "https://share.example"}
	w = call("GET", "/s/"+id, "", "")
	if w.Code != http.StatusFound || w.Header().Get("Location") != destination {
		t.Fatal(w.Code, w.Header())
	}
	for _, u := range []string{"https://evil.example/", target + "?x=1#share=z2.ABCD", "javascript:alert(1)"} {
		w = call("POST", "/v1/links", `{"url":"`+u+`"}`, origin)
		if w.Code != 400 {
			t.Fatal(u, w.Code)
		}
	}
	if call("POST", "/v1/links", `{"url":"`+destination+`"}`, "https://evil.example").Code != 403 {
		t.Fatal("origin")
	}
	if call("GET", "/s/../../secret", "", "").Code != 404 {
		t.Fatal("path")
	}
	files, _ := os.ReadDir(dir)
	if len(files) != 1 {
		t.Fatal("unexpected writes")
	}
}
