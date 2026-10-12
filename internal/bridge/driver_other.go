//go:build !windows && !darwin

package bridge

import (
	"errors"
	"image"
)

func PrintDriver(name string, im image.Image, j Job) error {
	return errors.New("native printer driver requires Windows or macOS")
}
