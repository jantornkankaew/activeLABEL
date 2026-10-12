//go:build !windows && !darwin

package bridge

import "errors"

func DiscoverPrinters() ([]Printer, error) {
	return nil, errors.New("OS printer discovery requires Windows or macOS")
}
