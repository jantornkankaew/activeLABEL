package codexbridge

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"strings"
	"testing"
)

func fakeRunner(reply string, login string, check func([]string, string, string)) Runner {
	return func(_ context.Context, _ string, args []string, dir, input string) ([]byte, error) {
		if args[0] == "login" {
			return []byte(login), nil
		}
		if check != nil {
			check(args, dir, input)
		}
		for i, arg := range args {
			if arg == "--output-last-message" {
				return nil, os.WriteFile(args[i+1], []byte(reply), 0600)
			}
		}
		return nil, errors.New("missing output path")
	}
}

func TestStructuredCodexResponseAndIsolation(t *testing.T) {
	var temporary string
	client := &Client{Run: fakeRunner(`{"message":"moved","commandsJson":"[{\"op\":\"update\",\"id\":\"price\",\"changes\":{\"x\":20}}]"}`, "Logged in using ChatGPT", func(args []string, dir, input string) {
		temporary = dir
		joined := strings.Join(args, " ")
		for _, required := range []string{"--ignore-user-config", "--ignore-rules", "--ephemeral", "--sandbox read-only", "forced_login_method=\"chatgpt\"", "--disable shell_tool", "--disable hooks", "--disable multi_agent", "--output-schema"} {
			if !strings.Contains(joined, required) {
				t.Errorf("missing constraint %q", required)
			}
		}
		if strings.Contains(joined, "user prompt") || !strings.Contains(input, "user prompt") {
			t.Error("prompt must use stdin, not command arguments")
		}
	})}
	result, err := client.Generate(context.Background(), "label instructions", "user prompt; $(touch fake)")
	if err != nil {
		t.Fatal(err)
	}
	var response struct {
		Message  string
		Commands []map[string]any
	}
	if json.Unmarshal(result, &response) != nil || len(response.Commands) != 1 || response.Commands[0]["op"] != "update" {
		t.Fatalf("invalid response: %s", result)
	}
	if _, err = os.Stat(temporary); !os.IsNotExist(err) {
		t.Fatal("temporary prompt/response files were not removed")
	}
}

func TestRefusesAPIKeyAndMissingLoginWithoutInference(t *testing.T) {
	for _, status := range []string{"Logged in using an API key", "Not logged in", ""} {
		client := &Client{Run: func(_ context.Context, _ string, args []string, _, _ string) ([]byte, error) {
			if args[0] != "login" {
				t.Fatal("must not infer without ChatGPT authentication")
			}
			return []byte(status), nil
		}}
		if _, err := client.Generate(context.Background(), "", ""); err == nil {
			t.Fatalf("accepted login state %q", status)
		}
	}
}

func TestInvalidCodexResponsesDoNotBecomeCommands(t *testing.T) {
	for _, response := range []string{
		`not json`, `{"message":"x","commandsJson":"null"}`,
		`{"message":"x","commandsJson":"{}"}`, `{"message":"x","commandsJson":"[]","extra":true}`,
		`{"message":"x","commandsJson":"[]"} {}`,
	} {
		client := &Client{Run: fakeRunner(response, "Logged in using ChatGPT", nil)}
		if _, err := client.Generate(context.Background(), "", ""); err == nil {
			t.Fatalf("accepted invalid output %s", response)
		}
	}
}

func TestTimeoutAndConcurrentRequestsFailWithoutRetry(t *testing.T) {
	client := &Client{Run: func(ctx context.Context, _ string, args []string, _, _ string) ([]byte, error) {
		if args[0] == "login" {
			return []byte("Logged in using ChatGPT"), nil
		}
		return nil, ctx.Err()
	}}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := client.Generate(ctx, "", ""); err == nil {
		t.Fatal("expected cancellation error")
	}
	client.mu.Lock()
	if _, err := client.Generate(context.Background(), "", ""); err == nil || !strings.Contains(err.Error(), "busy") {
		t.Fatal("concurrent request was not rejected")
	}
	client.mu.Unlock()
}

func TestNativeRunnerRemovesAPIKeys(t *testing.T) {
	t.Setenv("LABELCRAFT_TEST_HELPER", "1")
	t.Setenv("OPENAI_API_KEY", "test-only-secret")
	t.Setenv("CODEX_API_KEY", "test-only-secret")
	t.Setenv("LLM_API_KEY", "test-only-secret")
	output, err := nativeRun(context.Background(), os.Args[0], []string{"-test.run=TestProcessHelper"}, "", "")
	if err != nil || strings.TrimSpace(string(output)) != "no-api-keys" {
		t.Fatalf("inherited API keys: %s, %v", output, err)
	}
}

func TestProcessHelper(t *testing.T) {
	if os.Getenv("LABELCRAFT_TEST_HELPER") != "1" {
		return
	}
	for _, key := range []string{"OPENAI_API_KEY", "CODEX_API_KEY", "LLM_API_KEY"} {
		if os.Getenv(key) != "" {
			os.Exit(2)
		}
	}
	os.Stdout.WriteString("no-api-keys")
	os.Exit(0)
}
