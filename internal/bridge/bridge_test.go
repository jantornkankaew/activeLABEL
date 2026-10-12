package bridge

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/color"
	"image/png"
	"os"
	"strings"
	"testing"
)

func example() Job {
	im := image.NewRGBA(image.Rect(0, 0, 80, 80))
	var b bytes.Buffer
	png.Encode(&b, im)
	return Job{JobID: "test-1", PrinterID: "test", Copies: 1, WidthMM: 10, HeightMM: 10, DPI: 203, PNG: base64.StdEncoding.EncodeToString(b.Bytes())}
}
func TestDecodeGeometry(t *testing.T) {
	j := example()
	if _, e := Decode(j); e != nil {
		t.Fatal(e)
	}
	j.WidthMM = 50
	if _, e := Decode(j); e == nil {
		t.Fatal("mismatched geometry accepted")
	}
}
func TestZPLBitPacking(t *testing.T) {
	im := image.NewRGBA(image.Rect(0, 0, 9, 1))
	for x := 0; x < 9; x++ {
		im.Set(x, 0, color.White)
	}
	im.Set(0, 0, color.Black)
	im.Set(8, 0, color.Black)
	packet := string(ZPL(im, 2))
	if !strings.Contains(packet, "^GFA,2,2,2,8080") || !strings.Contains(packet, "^PQ2") {
		t.Fatal(packet)
	}
}
func TestPersistentIdempotency(t *testing.T) {
	dir := t.TempDir()
	j := example()
	m := Manager{Directory: dir, Printers: []Printer{{ID: "test", Name: "test", Mode: "unsupported", DPI: 203}}}
	first, e := m.Submit(j)
	if e != nil {
		t.Fatal(e)
	}
	again, e := m.Submit(j)
	if e != nil || again.Status != first.Status {
		t.Fatal("duplicate status changed")
	}
	j.Copies = 2
	if _, e = m.Submit(j); e == nil {
		t.Fatal("same job ID different payload accepted")
	}
	if _, e = os.Stat(m.path(j.JobID)); e != nil {
		t.Fatal(e)
	}
}
func TestPrinterConfigRejectsRequestTargets(t *testing.T) {
	if ValidatePrinters([]Printer{{ID: "a", Name: "a", Mode: "zpl_tcp", Address: "example.com:9100", DPI: 203}}) == nil {
		t.Fatal("unapproved hostname accepted")
	}
}
