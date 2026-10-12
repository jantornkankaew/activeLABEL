// Package codexbridge invokes the official Codex CLI without handling OAuth tokens.
package codexbridge

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

const maxOutput = 1_000_000

// Runner is injectable for tests. Prompts always travel over stdin, never a shell.
type Runner func(context.Context, string, []string, string, string) ([]byte, error)

type Client struct {
	Binary string
	Run    Runner
	mu     sync.Mutex
}

type cappedBuffer struct{ bytes.Buffer }

func (b *cappedBuffer) Write(p []byte) (int, error) {
	if b.Len()+len(p) > maxOutput {
		return 0, errors.New("Codex output limit exceeded")
	}
	return b.Buffer.Write(p)
}

func nativeRun(ctx context.Context, binary string, args []string, dir, input string) ([]byte, error) {
	cmd := exec.CommandContext(ctx, binary, args...)
	cmd.Dir = dir
	cmd.Stdin = strings.NewReader(input)
	// A ChatGPT selection must never silently charge an inherited API key.
	for _, entry := range os.Environ() {
		name := strings.SplitN(entry, "=", 2)[0]
		if !strings.EqualFold(name, "OPENAI_API_KEY") && !strings.EqualFold(name, "CODEX_API_KEY") && !strings.EqualFold(name, "LLM_API_KEY") {
			cmd.Env = append(cmd.Env, entry)
		}
	}
	var output cappedBuffer
	cmd.Stdout = &output
	cmd.Stderr = &output
	cmd.WaitDelay = 2 * time.Second
	err := cmd.Run()
	return output.Bytes(), err
}

func (c *Client) run(ctx context.Context, args []string, dir, input string) ([]byte, error) {
	run := c.Run
	if run == nil {
		run = nativeRun
	}
	binary := c.Binary
	if binary == "" {
		binary = "codex"
	}
	return run(ctx, binary, args, dir, input)
}

func (c *Client) Ready(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 8*time.Second)
	defer cancel()
	out, err := c.run(ctx, []string{"login", "status"}, "", "")
	if err != nil || !strings.Contains(string(out), "Logged in using ChatGPT") {
		return errors.New("Codex is not signed in with ChatGPT; run the local launcher and sign in using the official Codex login")
	}
	return nil
}

const schema = `{"type":"object","properties":{"message":{"type":"string"},"commandsJson":{"type":"string"}},"required":["message","commandsJson"],"additionalProperties":false}`

func (c *Client) Generate(ctx context.Context, instructions, input string) ([]byte, error) {
	// One inference at a time per connector. Do not queue unbounded CLI processes.
	if !c.mu.TryLock() {
		return nil, errors.New("Codex is busy; wait for the current request")
	}
	defer c.mu.Unlock()
	if err := c.Ready(ctx); err != nil {
		return nil, err
	}
	dir, err := os.MkdirTemp("", "labelcraft-codex-")
	if err != nil {
		return nil, errors.New("cannot prepare Codex request")
	}
	defer os.RemoveAll(dir)
	schemaPath := filepath.Join(dir, "response.schema.json")
	outputPath := filepath.Join(dir, "response.json")
	if err = os.WriteFile(schemaPath, []byte(schema), 0600); err != nil {
		return nil, errors.New("cannot prepare response schema")
	}
	args := []string{"exec", "--ignore-user-config", "--ignore-rules", "--ephemeral", "--skip-git-repo-check", "--sandbox", "read-only", "--color", "never",
		"--config", `approval_policy="never"`, "--config", `web_search="disabled"`, "--config", `forced_login_method="chatgpt"`,
		"--config", "project_doc_max_bytes=0", "--config", "mcp_servers={}",
		"--config", "skills.include_instructions=false", "--config", "tools.update_plan.enabled=false", "--config", "include_environment_context=false",
		"--output-schema", schemaPath, "--output-last-message", outputPath}
	// Disable executable/network/agent extensions. The CLI still enforces its sandbox.
	for _, feature := range []string{"shell_tool", "unified_exec", "multi_agent", "multi_agent_v2", "apps", "hooks", "code_mode", "code_mode_host", "browser_use", "computer_use", "image_generation", "view_image", "skill_search", "skill_mcp_dependency_install", "tool_suggest", "js_repl", "request_permissions_tool", "plugins", "remote_plugin", "plugin_sharing", "artifact", "goals", "sleep_tool"} {
		args = append(args, "--disable", feature)
	}
	args = append(args, "--enable", "skip_host_skill_discovery")
	args = append(args, "-")
	prompt := instructions + "\nReturn the structured response with message and commandsJson. commandsJson must be a JSON-encoded array of the commands described above, not executable code. Do not use tools, read files, run commands, or access other data.\n" + input
	if _, err = c.run(ctx, args, dir, prompt); err != nil {
		if ctx.Err() != nil {
			return nil, errors.New("Codex request timed out or was cancelled; the label was not changed")
		}
		return nil, errors.New("Codex request failed; check login, CLI version and subscription quota in the local terminal")
	}
	f, err := os.Open(outputPath)
	if err != nil {
		return nil, errors.New("Codex did not return a response")
	}
	defer f.Close()
	b, err := io.ReadAll(io.LimitReader(f, maxOutput+1))
	if err != nil || len(b) > maxOutput {
		return nil, errors.New("Codex response exceeds limit")
	}
	var wrapped struct {
		Message      string `json:"message"`
		CommandsJSON string `json:"commandsJson"`
	}
	d := json.NewDecoder(bytes.NewReader(b))
	d.DisallowUnknownFields()
	if d.Decode(&wrapped) != nil || d.Decode(new(any)) != io.EOF {
		return nil, errors.New("invalid Codex response")
	}
	var commands []json.RawMessage
	if json.Unmarshal([]byte(wrapped.CommandsJSON), &commands) != nil || commands == nil {
		return nil, errors.New("invalid Codex commands")
	}
	return json.Marshal(struct {
		Message  string            `json:"message"`
		Commands []json.RawMessage `json:"commands"`
	}{wrapped.Message, commands})
}
