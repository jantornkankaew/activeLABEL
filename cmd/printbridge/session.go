package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"time"
)

var setupPath = regexp.MustCompile(`^/setup/[-A-Za-z0-9_]{43}$`)

func validateSessionURL(value string) error {
	u, err := url.Parse(value)
	if err != nil || u.Host != "127.0.0.1:28171" || (u.Scheme != "http" && u.Scheme != "https") || u.User != nil || u.RawQuery != "" || u.Fragment != "" || !setupPath.MatchString(u.Path) {
		return errors.New("invalid local setup URL")
	}
	return nil
}
func writeSessionURL(path, value string) error {
	if err := validateSessionURL(value); err != nil {
		return err
	}
	b, err := json.Marshal(map[string]string{"url": value})
	if err != nil {
		return err
	}
	return os.WriteFile(path, b, 0600)
}
func readSessionURL(path string) (string, error) {
	info, err := os.Stat(path)
	if err != nil {
		return "", err
	}
	if info.Size() > 2048 {
		return "", errors.New("invalid session file")
	}
	b, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	var data struct {
		URL string `json:"url"`
	}
	if err = json.Unmarshal(b, &data); err != nil {
		return "", err
	}
	return data.URL, validateSessionURL(data.URL)
}
func sessionAvailable(value string) bool {
	if validateSessionURL(value) != nil {
		return false
	}
	client := http.Client{Timeout: 3 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	r, err := client.Head(value)
	if err != nil {
		return false
	}
	defer r.Body.Close()
	return r.StatusCode == 200 && r.Header.Get("Cache-Control") == "no-store"
}
