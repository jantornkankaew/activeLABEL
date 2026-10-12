package chatgptapp

import (
	"context"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

type fixtureEngine struct{ calls int }

func (e *fixtureEngine) Process(_ context.Context, operation string, input map[string]any) (map[string]any, error) {
	e.calls++
	doc := map[string]any{"schemaVersion": 1, "id": "test-label", "revision": 0, "title": "Test", "width": 50, "height": 30, "objects": []any{}}
	if operation == "propose" {
		doc = input["document"].(map[string]any)
	}
	return map[string]any{"status": "opened", "document": doc}, nil
}

func TestOfficialMCPClientToolsAndWidgetResource(t *testing.T) {
	engine := &fixtureEngine{}
	server := NewServer("<!doctype html><html><body>LabelCraft test widget</body></html>", engine)
	handler := mcp.NewStreamableHTTPHandler(func(*http.Request) *mcp.Server { return server }, &mcp.StreamableHTTPOptions{Stateless: true, JSONResponse: true, MaxRequestBodyBytes: 1_000_000})
	httpServer := httptest.NewServer(handler)
	defer httpServer.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client := mcp.NewClient(&mcp.Implementation{Name: "labelcraft-test", Version: "1"}, nil)
	session, err := client.Connect(ctx, &mcp.StreamableClientTransport{Endpoint: httpServer.URL}, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer session.Close()
	tools, err := session.ListTools(ctx, nil)
	if err != nil || len(tools.Tools) != 2 {
		t.Fatalf("tools/list: %v", err)
	}
	for _, tool := range tools.Tools {
		if tool.Meta["openai/outputTemplate"] == nil || !tool.Annotations.ReadOnlyHint {
			t.Fatal("missing widget/preview metadata")
		}
	}
	resources, err := session.ListResources(ctx, nil)
	if err != nil || len(resources.Resources) != 1 {
		t.Fatalf("resources/list: %v", err)
	}
	resource, err := session.ReadResource(ctx, &mcp.ReadResourceParams{URI: resources.Resources[0].URI})
	if err != nil || resource.Contents[0].MIMEType != "text/html+skybridge" || resource.Contents[0].Meta["openai/widgetCSP"] == nil {
		t.Fatalf("widget resource: %v", err)
	}
	result, err := session.CallTool(ctx, &mcp.CallToolParams{Name: "labelcraft_open", Arguments: map[string]any{"title": "Test", "widthMm": 50, "heightMm": 30}})
	if err != nil || result.IsError || result.Meta["openai/widgetSessionId"] != "test-label" {
		t.Fatalf("tools/call: %v %+v", err, result)
	}
	if engine.calls != 1 {
		t.Fatal("unexpected engine executions")
	}
	for _, invalid := range []map[string]any{{"widthMm": 2}, {"execute": "touch x"}, {"widthMm": "not numeric"}} {
		result, err := session.CallTool(ctx, &mcp.CallToolParams{Name: "labelcraft_open", Arguments: invalid})
		if err == nil && !result.IsError {
			t.Fatal("invalid input accepted")
		}
	}
	if engine.calls != 1 {
		t.Fatal("schema-invalid requests reached the engine")
	}
}

func TestMCPRejectsUnknownCommandBeforeEngine(t *testing.T) {
	engine := &fixtureEngine{}
	server := NewServer("<html>LabelCraft</html>", engine)
	httpServer := httptest.NewServer(mcp.NewStreamableHTTPHandler(func(*http.Request) *mcp.Server { return server }, &mcp.StreamableHTTPOptions{Stateless: true, JSONResponse: true}))
	defer httpServer.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	session, err := mcp.NewClient(&mcp.Implementation{Name: "test", Version: "1"}, nil).Connect(ctx, &mcp.StreamableClientTransport{Endpoint: httpServer.URL}, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer session.Close()
	doc := map[string]any{"schemaVersion": 1, "id": "label", "revision": 0, "title": "Test", "width": 50, "height": 30, "objects": []any{}}
	result, err := session.CallTool(ctx, &mcp.CallToolParams{Name: "labelcraft_propose_edit", Arguments: map[string]any{"document": doc, "baseRevision": 0, "commands": []any{map[string]any{"op": "print", "printer": "untrusted"}}}})
	if err == nil && !result.IsError {
		t.Fatal("raw print command accepted")
	}
	if engine.calls != 0 {
		t.Fatal("invalid command reached engine")
	}
}
