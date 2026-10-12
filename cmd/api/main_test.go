package main

import (
	"context"
	"encoding/json"
	"io"
	"labelcraft/internal/codexbridge"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

const document = `{"objects":[{"id":"asset","kind":"image","content":"data:private-image"}]}`

func designRequest(provider string) *http.Request {
	return httptest.NewRequest("POST", "/v1/design", strings.NewReader(`{"prompt":"move","provider":"`+provider+`","document":`+document+`,"selectedId":null}`))
}

func TestAPIUsesConfiguredProviderAndOmitsImageData(t *testing.T) {
	t.Setenv("LLM_API_KEY", "test-only-key")
	t.Setenv("LLM_MODEL", "test-model")
	t.Setenv("LABELCRAFT_CODEX_ENABLED", "0")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer test-only-key" {
			t.Error("API auth not forwarded to configured provider")
		}
		body, _ := io.ReadAll(r.Body)
		if strings.Contains(string(body), "data:private-image") || !strings.Contains(string(body), "local image asset omitted") {
			t.Error("image data was sent to provider")
		}
		json.NewEncoder(w).Encode(map[string]any{"choices": []any{map[string]any{"message": map[string]any{"content": `{"message":"ok","commands":[]}`}}}})
	}))
	defer server.Close()
	t.Setenv("LLM_URL", server.URL)
	w := httptest.NewRecorder()
	handler(w, designRequest("api"))
	if w.Code != 200 || !strings.Contains(w.Body.String(), `"message":"ok"`) {
		t.Fatal(w.Code, w.Body.String())
	}
}

func TestProviderChoiceNeverFallsBack(t *testing.T) {
	t.Setenv("LLM_API_KEY", "")
	t.Setenv("LLM_MODEL", "")
	t.Setenv("LABELCRAFT_CODEX_ENABLED", "0")
	for _, provider := range []string{"api", "codex", "unexpected"} {
		w := httptest.NewRecorder()
		handler(w, designRequest(provider))
		expected := 503
		if provider == "unexpected" {
			expected = 400
		}
		if w.Code != expected {
			t.Fatal(provider, w.Code, w.Body.String())
		}
	}
}

func TestCodexResponseUsesSharedCommandChecks(t *testing.T) {
	t.Setenv("LABELCRAFT_CODEX_ENABLED", "1")
	t.Setenv("LLM_API_KEY", "")
	t.Setenv("LLM_MODEL", "")
	old := codexClient
	t.Cleanup(func() { codexClient = old })
	for _, commands := range []string{`[{"op":"print"}]`, `[{"op":"update","id":"x","changes":{"execute":"touch fake"}}]`} {
		codexClient = &codexbridge.Client{Run: func(_ context.Context, _ string, args []string, _, input string) ([]byte, error) {
			if args[0] == "login" {
				return []byte("Logged in using ChatGPT"), nil
			}
			if strings.Contains(input, "data:private-image") {
				t.Error("image asset leaked to Codex")
			}
			body, _ := json.Marshal(map[string]string{"message": "invalid", "commandsJson": commands})
			for i, arg := range args {
				if arg == "--output-last-message" {
					return nil, os.WriteFile(args[i+1], body, 0600)
				}
			}
			return nil, nil
		}}
		w := httptest.NewRecorder()
		handler(w, designRequest("codex"))
		if w.Code != 502 {
			t.Fatal(w.Code, w.Body.String())
		}
	}
}

func TestStatusDoesNotReportDisabledCodexAsReady(t *testing.T) {
	t.Setenv("LABELCRAFT_CODEX_ENABLED", "0")
	t.Setenv("LLM_API_KEY", "")
	t.Setenv("LLM_MODEL", "")
	w := httptest.NewRecorder()
	providerStatus(w, httptest.NewRequest("GET", "/v1/providers", nil))
	if strings.Contains(w.Body.String(), `"ready":true`) {
		t.Fatal("reported unconfigured provider as connected")
	}
}

func TestLocalConnectorRejectsPublicBinding(t *testing.T) {
	for _, addr := range []string{"0.0.0.0:28172", ":28172", "example.com:28172", "192.168.1.2:28172"} {
		if validateListener(addr, true) == nil {
			t.Fatal("accepted nonlocal listener", addr)
		}
	}
	for _, addr := range []string{"127.0.0.1:28172", "localhost:28172", "[::1]:28172"} {
		if err := validateListener(addr, true); err != nil {
			t.Fatal(err)
		}
	}
	if err := validateListener("0.0.0.0:28172", false); err != nil {
		t.Fatal("hosted API listener should remain available")
	}
}
