//go:build !windows && !darwin && !linux

package bridge

import (
	"errors"
	"image"
)

func PrintDriver(name string, im image.Image, j Job) error {
	return errors.New("native printer driver requires Windows, macOS or Linux with CUPS")
}
