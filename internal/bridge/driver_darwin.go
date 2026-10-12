//go:build darwin

package bridge

import (
	"fmt"
	"image"
	"os"
	"strconv"
	"strings"
	"time"
)

func PrintDriver(name string, im image.Image, j Job) error {
	pdf, err := labelPDF(im, j.WidthMM, j.HeightMM)
	if err != nil {
		return err
	}
	file, err := os.CreateTemp("", "labelcraft-*.pdf")
	if err != nil {
		return err
	}
	path := file.Name()
	defer os.Remove(path)
	if _, err = file.Write(pdf); err != nil {
		file.Close()
		return err
	}
	if err = file.Close(); err != nil {
		return err
	}
	media := fmt.Sprintf("media=Custom.%sx%smm", strconv.FormatFloat(j.WidthMM, 'f', 3, 64), strconv.FormatFloat(j.HeightMM, 'f', 3, 64))
	_, stderr, err := nativeCommand(30*time.Second, "/usr/bin/lp", "-d", name, "-n", strconv.Itoa(j.Copies), "-t", "LabelCraft "+j.JobID, "-o", media, "-o", "fit-to-page=false", "-o", "scaling=100", "-o", "position=top-left", "-o", "page-left=0", "-o", "page-right=0", "-o", "page-top=0", "-o", "page-bottom=0", "-o", "sides=one-sided", path)
	if err != nil {
		return fmt.Errorf("macOS lp submission: %v: %s", err, strings.TrimSpace(stderr))
	}
	return nil
}
