package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"html/template"
	"io"
	"labelcraft/internal/bridge"
	"labelcraft/internal/httpguard"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const appURL = "https://jantornkankaew.github.io/labelcraft/"

func main() {
	config := flag.String("config", "", "optional explicit printer profiles; default discovers OS queues")
	cert := flag.String("tls-cert", os.Getenv("BRIDGE_TLS_CERT"), "optional trusted localhost TLS certificate")
	key := flag.String("tls-key", os.Getenv("BRIDGE_TLS_KEY"), "TLS private key")
	directory := flag.String("jobs", "", "persistent job directory")
	list := flag.Bool("list", false, "list installed OS printers and exit without printing")
	headless := flag.Bool("headless", false, "do not open the local pairing page")
	flag.Parse()
	if *list {
		printers, err := bridge.DiscoverPrinters()
		if err != nil {
			log.Fatal(err)
		}
		json.NewEncoder(os.Stdout).Encode(printers)
		return
	}
	var printers []bridge.Printer
	var err error
	discover := *config == ""
	if discover {
		printers, err = bridge.DiscoverPrinters()
	} else {
		var data []byte
		data, err = os.ReadFile(*config)
		if err == nil {
			err = json.Unmarshal(data, &printers)
		}
	}
	if err != nil {
		if !discover {
			log.Fatal(err)
		}
		printers = []bridge.Printer{}
	}
	if err = bridge.ValidatePrinters(printers); err != nil {
		log.Fatal(err)
	}
	token := os.Getenv("LABELCRAFT_BRIDGE_TOKEN")
	if token == "" {
		token = randomSecret()
	}
	if len(token) < 24 {
		log.Fatal("Pairing token must contain at least 24 characters")
	}
	if *directory == "" {
		root, err := os.UserConfigDir()
		if err != nil {
			log.Fatal(err)
		}
		*directory = filepath.Join(root, "LabelCraft", "print-jobs")
	}
	if err = os.MkdirAll(*directory, 0700); err != nil {
		log.Fatal(err)
	}
	manager := bridge.Manager{Printers: printers, Directory: *directory}
	refresh := func() ([]bridge.Printer, error) {
		if !discover {
			return printers, nil
		}
		next, err := bridge.DiscoverPrinters()
		if err != nil {
			return nil, err
		}
		if err = manager.ReplacePrinters(next); err != nil {
			return nil, err
		}
		return next, nil
	}
	origins := []string{"https://jantornkankaew.github.io"}
	if configured := os.Getenv("LABELCRAFT_ALLOWED_ORIGINS"); configured != "" {
		origins = strings.Split(configured, ",")
	}
	api := http.NewServeMux()
	api.HandleFunc("GET /v1/printers", func(w http.ResponseWriter, r *http.Request) {
		next, err := refresh()
		if err != nil {
			httpguard.JSON(w, 503, map[string]string{"error": err.Error()})
			return
		}
		public := make([]map[string]any, 0, len(next))
		for _, p := range next {
			public = append(public, map[string]any{"id": p.ID, "name": p.Name, "dpi": p.DPI, "mode": p.Mode})
		}
		httpguard.JSON(w, 200, map[string]any{"printers": public})
	})
	api.HandleFunc("POST /v1/jobs", func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, 13_000_000)
		defer r.Body.Close()
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		var job bridge.Job
		if err := decoder.Decode(&job); err != nil || decoder.Decode(new(any)) != io.EOF {
			httpguard.JSON(w, 400, map[string]string{"error": "invalid print job"})
			return
		}
		if _, err := refresh(); err != nil {
			httpguard.JSON(w, 503, map[string]string{"error": err.Error()})
			return
		}
		record, err := manager.Submit(job)
		if err != nil {
			httpguard.JSON(w, 400, map[string]string{"error": err.Error()})
			return
		}
		httpguard.JSON(w, 200, record)
	})
	if (*cert == "") != (*key == "") {
		log.Fatal("Set both -tls-cert and -tls-key")
	}
	scheme := "http"
	if *cert != "" {
		scheme = "https"
	}
	endpoint := scheme + "://127.0.0.1:28171"
	nonce := randomSecret()
	pairJSON, _ := json.Marshal(map[string]string{"url": endpoint, "token": token})
	pairURL := appURL + "#bridge=" + base64.RawURLEncoding.EncodeToString(pairJSON)
	root := http.NewServeMux()
	root.Handle("/v1/", httpguard.Protect(token, origins, api))
	root.HandleFunc("GET /setup/"+nonce, func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Origin") != "" {
			http.Error(w, "navigation only", 403)
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		next, discoveryErr := refresh()
		message := ""
		if discoveryErr != nil {
			message = discoveryErr.Error()
		}
		page.Execute(w, struct {
			URL   string
			Count int
			Error string
		}{pairURL, len(next), message})
	})
	server := http.Server{Addr: "127.0.0.1:28171", Handler: httpguard.Loopback(origins, root), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 20 * time.Second, WriteTimeout: 45 * time.Second, IdleTimeout: 30 * time.Second}
	if !*headless {
		go func() {
			time.Sleep(300 * time.Millisecond)
			if err := openBrowser(endpoint + "/setup/" + nonce); err != nil {
				log.Print("Could not open the setup browser; restart with a working default browser")
			}
		}()
	}
	log.Print("LabelCraft local print helper running on loopback :28171; leave this process open")
	if *cert != "" {
		log.Fatal(server.ListenAndServeTLS(*cert, *key))
	} else {
		log.Fatal(server.ListenAndServe())
	}
}
func randomSecret() string {
	data := make([]byte, 32)
	if _, err := rand.Read(data); err != nil {
		log.Fatal("Could not generate a local pairing secret")
	}
	return base64.RawURLEncoding.EncodeToString(data)
}
func openBrowser(value string) error {
	parsed, err := url.Parse(value)
	if err != nil || parsed.Host != "127.0.0.1:28171" {
		return fmt.Errorf("invalid setup URL")
	}
	switch runtime.GOOS {
	case "windows":
		for _, key := range []string{"LOCALAPPDATA", "PROGRAMFILES", "PROGRAMFILES(X86)"} {
			if root := os.Getenv(key); root != "" {
				path := filepath.Join(root, "Google", "Chrome", "Application", "chrome.exe")
				if _, err := os.Stat(path); err == nil {
					return exec.Command(path, value).Run()
				}
			}
		}
		return exec.Command("rundll32.exe", "url.dll,FileProtocolHandler", value).Run()
	case "linux":
		return exec.Command("/usr/bin/xdg-open", value).Run()
	case "darwin":
		return exec.Command("/usr/bin/open", "-a", "Google Chrome", value).Run()
	default:
		return fmt.Errorf("local helper requires Windows or macOS")
	}
}

var page = template.Must(template.New("setup").Parse(`<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LabelCraft local printer</title><style>body{font:16px system-ui;background:#edf5f2;color:#20332b;margin:0;padding:40px}main{max-width:520px;margin:10vh auto;background:white;padding:32px;border-radius:18px;box-shadow:0 8px 40px #20332b18}h1{font-size:24px}p{line-height:1.8}a{display:inline-block;padding:14px 20px;border-radius:8px;background:#08745b;color:white;text-decoration:none}small{color:#61786c}</style><main><h1>เชื่อมเครื่องพิมพ์กับ LabelCraft</h1><p>{{if .Error}}ยังอ่านรายชื่อจากระบบไม่ได้: {{.Error}}{{else}}อ่านรายชื่อจากระบบได้ {{.Count}} เครื่องพิมพ์{{end}}<br>กดปุ่มเพื่อจับคู่กับเว็บ LabelCraft</p><a href="{{.URL}}">เปิด LabelCraft และเชื่อมเครื่องพิมพ์</a><p><small>หาก Chrome ถามสิทธิ์เข้าถึงเครือข่ายภายใน ให้อนุญาตเว็บไซต์ LabelCraft<br>เปิดโปรแกรมตัวเชื่อมนี้ไว้ระหว่างใช้งาน ไม่มีการสั่งพิมพ์อัตโนมัติ</small></p></main></html>`))
