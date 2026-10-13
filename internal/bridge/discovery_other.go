//go:build !windows && !darwin && !linux

package bridge

import "errors"

func DiscoverPrinters() ([]Printer, error) {
	return nil, errors.New("OS printer discovery requires Windows, macOS or Linux with CUPS")
}
