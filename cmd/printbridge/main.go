package main

import (
	"encoding/json"
	"flag"
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
		if e := decoder.Decode(&j); e != nil {
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
	server := http.Server{Addr: "127.0.0.1:28171", Handler: httpguard.Protect(token, origins, mux), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 20 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 30 * time.Second}
	log.Print("Print bridge on loopback :28171; no physical print success guarantee")
	log.Fatal(server.ListenAndServe())
}
