package bridge

import (
	"bytes"
	"image"
	"image/color"
	"reflect"
	"regexp"
	"runtime"
	"strconv"
	"testing"
)

func TestNativeQueuesAreStableAndUnknownDPI(t *testing.T) {
	a, err := nativePrinters([]string{"TSC queue", "Zebra queue", "TSC queue"}, "windows_driver")
	if err != nil {
		t.Fatal(err)
	}
	if len(a) != 2 || a[0].DPI != 0 || a[0].ID == a[1].ID {
		t.Fatal(a)
	}
	b, _ := nativePrinters([]string{"Zebra queue", "TSC queue"}, "windows_driver")
	if a[0].ID != b[1].ID {
		t.Fatal("IDs changed with ordering")
	}
	if err = ValidatePrinters(a); err != nil {
		t.Fatal(err)
	}
	m := Manager{}
	if err = m.ReplacePrinters(a); err != nil {
		t.Fatal(err)
	}
	a[0].Name = "mutated"
	if m.Printers[0].Name == a[0].Name {
		t.Fatal("manager aliases discovery")
	}
}
func TestCUPSQueueParsingAndInvalidNames(t *testing.T) {
	names := parseCUPSNames("printer TSC_USB is idle. enabled since now\nprinter Zebra_LAN disabled since today\n\treason text\n")
	if !reflect.DeepEqual(names, []string{"TSC_USB", "Zebra_LAN"}) {
		t.Fatal(names)
	}
	for _, name := range []string{"", "\x00", "bad\nqueue"} {
		if _, err := nativePrinters([]string{name}, "macos_driver"); err == nil {
			t.Fatal("accepted invalid name")
		}
	}
}
func TestActualOSDiscoveryWithoutPrinting(t *testing.T) {
	if runtime.GOOS != "windows" && runtime.GOOS != "darwin" {
		t.Skip("native discovery is checked on Windows/macOS CI")
	}
	queues, err := DiscoverPrinters()
	if err != nil {
		t.Fatal(err)
	}
	if err = ValidatePrinters(queues); err != nil {
		t.Fatal(err)
	}
	t.Logf("native OS API returned %d installed queues; no print was sent", len(queues))
}
func TestMacPDFHasExactPhysicalPageAndValidObjectOffsets(t *testing.T) {
	im := image.NewNRGBA(image.Rect(0, 0, 2, 1))
	im.Set(0, 0, color.Black)
	im.Set(1, 0, color.Transparent)
	pdf, err := labelPDF(im, 60, 40)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Contains(pdf, []byte("/MediaBox [0 0 170.078740 113.385827]")) {
		t.Fatal("physical page changed")
	}
	entries := regexp.MustCompile(`(?m)^(\d{10}) 00000 n `).FindAllSubmatch(pdf, -1)
	if len(entries) != 5 {
		t.Fatal("missing PDF objects")
	}
	for index, entry := range entries {
		offset, _ := strconv.Atoi(string(entry[1]))
		expected := []byte(strconv.Itoa(index+1) + " 0 obj")
		if !bytes.HasPrefix(pdf[offset:], expected) {
			t.Fatal("invalid xref offset")
		}
	}
}
