//go:build !windows

package bridge

import (
	"errors"
	"image"
)

func PrintDriver(name string, im image.Image, j Job) error {
	return errors.New("native macOS driver adapter is not implemented; use tested ZPL LAN profile")
}
