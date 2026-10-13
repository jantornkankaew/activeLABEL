package main

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestPrivatePairingRecovery(t *testing.T) {
	path := filepath.Join(t.TempDir(), "session.json")
	value := "http://127.0.0.1:28171/setup/" + strings.Repeat("a", 43)
	if err := writeSessionURL(path, value); err != nil {
		t.Fatal(err)
	}
	got, err := readSessionURL(path)
	if err != nil || got != value {
		t.Fatal(got, err)
	}
	info, _ := os.Stat(path)
	if runtime.GOOS != "windows" && info.Mode().Perm() != 0600 {
		t.Fatal(info.Mode())
	}
	for _, bad := range []string{"https://example.com/setup/" + strings.Repeat("a", 43), value + "?token=x", value + "#fragment", "http://127.0.0.1:28171/setup/../v1/jobs", "http://user@127.0.0.1:28171/setup/" + strings.Repeat("a", 43)} {
		if validateSessionURL(bad) == nil {
			t.Fatal("accepted", bad)
		}
	}
}
