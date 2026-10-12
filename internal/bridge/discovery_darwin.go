//go:build darwin

package bridge

import (
	"fmt"
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
		return nil, fmt.Errorf("macOS printer discovery: %v: %s", err, strings.TrimSpace(stderr))
	}
	return nativePrinters(parseCUPSNames(out), "macos_driver")
}
