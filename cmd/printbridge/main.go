package main

import (
	"encoding/json"
	"flag"
	"io"
	"labelcraft/internal/bridge"
	"labelcraft/internal/httpguard"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

func main() {
	config := flag.String("config", "printers.json", "printer configuration file")
	cert := flag.String("tls-cert", os.Getenv("BRIDGE_TLS_CERT"), "trusted localhost TLS certificate")
	key := flag.String("tls-key", os.Getenv("BRIDGE_TLS_KEY"), "TLS private key (local only)")
	directory := flag.String("jobs", "bridge-jobs", "persistent job directory")
	flag.Parse()
	token := os.Getenv("LABELCRAFT_BRIDGE_TOKEN")
	if len(token) < 24 {
		log.Fatal("Set LABELCRAFT_BRIDGE_TOKEN to a random token of at least 24 characters")
	}
	b, e := os.ReadFile(*config)
	if e != nil {
		log.Fatal(e)
	}
	var printers []bridge.Printer
	if e = json.Unmarshal(b, &printers); e != nil {
		log.Fatal(e)
	}
	if e = bridge.ValidatePrinters(printers); e != nil {
		log.Fatal(e)
	}
	if e = os.MkdirAll(*directory, 0700); e != nil {
		log.Fatal(e)
	}
	manager := bridge.Manager{Printers: printers, Directory: *directory}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/printers", func(w http.ResponseWriter, r *http.Request) {
		public := make([]map[string]any, 0, len(printers))
		for _, p := range printers {
			public = append(public, map[string]any{"id": p.ID, "name": p.Name, "dpi": p.DPI, "mode": p.Mode})
		}
		httpguard.JSON(w, 200, map[string]any{"printers": public})
	})
	mux.HandleFunc("POST /v1/jobs", func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, 13_000_000)
		defer r.Body.Close()
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		var j bridge.Job
		if e := decoder.Decode(&j); e != nil || decoder.Decode(new(any)) != io.EOF {
			httpguard.JSON(w, 400, map[string]string{"error": "invalid print job"})
			return
		}
		record, e := manager.Submit(j)
		if e != nil {
			httpguard.JSON(w, 400, map[string]string{"error": e.Error()})
			return
		}
		httpguard.JSON(w, 200, record)
	})
	origins := strings.Split(os.Getenv("LABELCRAFT_ALLOWED_ORIGINS"), ",")
	server := http.Server{Addr: "127.0.0.1:28171", Handler: httpguard.Loopback(origins, httpguard.Protect(token, origins, mux)), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 20 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 30 * time.Second}
	if (*cert == "") != (*key == "") {
		log.Fatal("Set both -tls-cert and -tls-key")
	}
	for _, origin := range origins {
		if strings.HasPrefix(origin, "https://") && *cert == "" {
			log.Fatal("Hosted HTTPS pages require trusted TLS: set -tls-cert and -tls-key; use Chrome system printing without a bridge if TLS is not configured")
		}
	}
	log.Print("Print bridge on loopback :28171; no physical print success guarantee")
	if *cert != "" {
		log.Fatal(server.ListenAndServeTLS(*cert, *key))
	} else {
		log.Fatal(server.ListenAndServe())
	}
}
