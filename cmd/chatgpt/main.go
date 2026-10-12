package main

import (
	"context"
	"flag"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"html"
	"labelcraft/internal/chatgptapp"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

func main() {
	assets := flag.String("assets", "dist-chatgpt", "built widget/engine directory")
	flag.Parse()
	widgetHTML, err := os.ReadFile(filepath.Join(*assets, "widget.html"))
	if err != nil {
		log.Fatal("Build the ChatGPT app first with npm run build:chatgpt")
	}
	worker, err := filepath.Abs(filepath.Join(*assets, "engine", "worker.mjs"))
	if err != nil {
		log.Fatal(err)
	}
	if _, err = os.Stat(worker); err != nil {
		log.Fatal("Missing shared engine worker")
	}
	engine := &chatgptapp.NodeEngine{Node: os.Getenv("NODE_BINARY"), Worker: worker}
	if _, err = engine.Process(context.Background(), "open", map[string]any{}); err != nil {
		log.Fatal("Shared label engine is not ready: ", err)
	}
	server := chatgptapp.NewServer(string(widgetHTML), engine)
	transport := mcp.NewStreamableHTTPHandler(func(*http.Request) *mcp.Server { return server }, &mcp.StreamableHTTPOptions{Stateless: true, JSONResponse: true, MaxRequestBodyBytes: 1_000_000, PropagateRequestCancellation: true})
	publicURL := os.Getenv("MCP_PUBLIC_URL")
	if publicURL == "" {
		publicURL = os.Getenv("RENDER_EXTERNAL_URL")
	}
	var allowedHost string
	if publicURL != "" {
		parsed, err := url.Parse(publicURL)
		if err != nil || parsed.Scheme != "https" || parsed.Hostname() == "" || parsed.User != nil {
			log.Fatal("MCP_PUBLIC_URL must be an HTTPS URL")
		}
		allowedHost = parsed.Hostname()
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		endpoint := publicURL + "/mcp"
		if publicURL == "" {
			endpoint = "Development server only; deploy on HTTPS to connect ChatGPT"
		}
		w.Write([]byte("<!doctype html><html lang=\"th\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>LabelCraft ChatGPT app</title><body style=\"font-family:Arial,sans-serif;max-width:760px;margin:50px auto;padding:20px;line-height:1.8\"><h1>LabelCraft for ChatGPT</h1><p>MCP server พร้อมแล้ว คัดลอก endpoint นี้ไปเพิ่มแอปใน ChatGPT:</p><pre style=\"white-space:pre-wrap;overflow-wrap:anywhere;padding:16px;background:#f0f6f3\">" + html.EscapeString(endpoint) + "</pre><p>Authentication: No authentication</p><p><a href=\"https://github.com/jantornkankaew/labelcraft/blob/main/docs/CHATGPT_APP.md\">คู่มือเพิ่มแอปภาษาไทย</a> · <a href=\"/healthz\">ตรวจสถานะ</a></p><p>หน้านี้เป็นหน้าตั้งค่า ไม่ได้เชื่อมบัญชี ChatGPT ของคุณแล้วโดยอัตโนมัติ</p></body></html>"))
	})
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","app":"labelcraft-chatgpt"}`))
	})
	mux.Handle("/mcp", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if origin := r.Header.Get("Origin"); origin != "" && origin != "https://chatgpt.com" && origin != "https://chat.openai.com" && origin != publicURL {
			http.Error(w, "origin not allowed", 403)
			return
		}
		if allowedHost != "" {
			host := r.Host
			if parsed, err := url.Parse("http://" + host); err == nil {
				host = parsed.Hostname()
			}
			if host != allowedHost {
				http.Error(w, "host not allowed", 403)
				return
			}
		}
		transport.ServeHTTP(w, r)
	}))
	port := os.Getenv("PORT")
	if port == "" {
		port = "8787"
	}
	if number, err := strconv.Atoi(port); err != nil || number < 1 || number > 65535 || strings.ContainsAny(port, ":/ ") {
		log.Fatal("PORT must be an integer between 1 and 65535")
	}
	addr := "127.0.0.1:" + port
	if allowedHost != "" {
		addr = "0.0.0.0:" + port
	}
	log.Printf("LabelCraft ChatGPT MCP on %s/mcp; no API key, account tokens, persistent documents or printing", addr)
	httpServer := http.Server{Addr: addr, Handler: mux, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 20 * time.Second, IdleTimeout: 30 * time.Second, MaxHeaderBytes: 16 << 10}
	log.Fatal(httpServer.ListenAndServe())
}
