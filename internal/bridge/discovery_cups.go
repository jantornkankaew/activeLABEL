//go:build darwin || linux

package bridge

import (
	"fmt"
	"runtime"
	"strings"
	"time"
)

func DiscoverPrinters() ([]Printer, error) {
	out, stderr, err := nativeCommand(5*time.Second, "/usr/bin/lpstat", "-p")
	if err != nil {
		lower := strings.ToLower(stderr)
		if strings.Contains(lower, "no destinations") || strings.Contains(lower, "no printers") {
			return []Printer{}, nil
		}
		return nil, fmt.Errorf("CUPS printer discovery: %v: %s", err, strings.TrimSpace(stderr))
	}
	mode := "macos_driver"
	if runtime.GOOS == "linux" {
		mode = "linux_driver"
	}
	return nativePrinters(parseCUPSNames(out), mode)
}
