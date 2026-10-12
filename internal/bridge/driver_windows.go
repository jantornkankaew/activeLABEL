//go:build windows

package bridge

import (
	"fmt"
	"image"
	"syscall"
	"unsafe"
)

var gdi = syscall.NewLazyDLL("gdi32.dll")

type docInfo struct {
	Size                   int32
	Name, Output, Datatype *uint16
	Type                   uint32
}
type bitmapInfo struct {
	Size                   uint32
	Width, Height          int32
	Planes, BitCount       uint16
	Compression, SizeImage uint32
	XPels, YPels           int32
	Colors, Important      uint32
}

func PrintDriver(name string, im image.Image, j Job) error {
	n, e := syscall.UTF16PtrFromString(name)
	if e != nil {
		return e
	}
	driver, _ := syscall.UTF16PtrFromString("WINSPOOL")
	dc, _, err := gdi.NewProc("CreateDCW").Call(uintptr(unsafe.Pointer(driver)), uintptr(unsafe.Pointer(n)), 0, 0)
	if dc == 0 {
		return fmt.Errorf("CreateDC: %v", err)
	}
	defer gdi.NewProc("DeleteDC").Call(dc)
	caps := gdi.NewProc("GetDeviceCaps")
	dx, _, _ := caps.Call(dc, 88)
	dy, _, _ := caps.Call(dc, 90)
	rw, _, _ := caps.Call(dc, 8)
	rh, _, _ := caps.Call(dc, 10)
	w := int(j.WidthMM*float64(dx)/25.4 + .5)
	h := int(j.HeightMM*float64(dy)/25.4 + .5)
	if w <= 0 || h <= 0 || w > int(rw) || h > int(rh) {
		return fmt.Errorf("driver paper/printable area too small; configure label size in driver")
	}
	title, _ := syscall.UTF16PtrFromString("LabelCraft " + j.JobID)
	di := docInfo{Name: title}
	di.Size = int32(unsafe.Sizeof(di))
	ok, _, err := gdi.NewProc("StartDocW").Call(dc, uintptr(unsafe.Pointer(&di)))
	if int32(ok) <= 0 {
		return fmt.Errorf("StartDoc: %v", err)
	}
	completed := false
	defer func() {
		if !completed {
			gdi.NewProc("AbortDoc").Call(dc)
		}
	}()
	b := im.Bounds()
	pixels := make([]byte, b.Dx()*b.Dy()*4)
	for y := 0; y < b.Dy(); y++ {
		for x := 0; x < b.Dx(); x++ {
			r, g, blue, a := im.At(b.Min.X+x, b.Min.Y+y).RGBA()
			i := (y*b.Dx() + x) * 4
			pixels[i] = uint8((blue + 65535 - a) >> 8)
			pixels[i+1] = uint8((g + 65535 - a) >> 8)
			pixels[i+2] = uint8((r + 65535 - a) >> 8)
		}
	}
	bi := bitmapInfo{Size: 40, Width: int32(b.Dx()), Height: -int32(b.Dy()), Planes: 1, BitCount: 32}
	gdi.NewProc("SetStretchBltMode").Call(dc, 3)
	for c := 0; c < j.Copies; c++ {
		ok, _, err = gdi.NewProc("StartPage").Call(dc)
		if int32(ok) <= 0 {
			return fmt.Errorf("StartPage: %v", err)
		}
		ok, _, err = gdi.NewProc("StretchDIBits").Call(dc, 0, 0, uintptr(w), uintptr(h), 0, 0, uintptr(b.Dx()), uintptr(b.Dy()), uintptr(unsafe.Pointer(&pixels[0])), uintptr(unsafe.Pointer(&bi)), 0, 0x00CC0020)
		if int32(ok) <= 0 {
			return fmt.Errorf("draw bitmap: %v", err)
		}
		ok, _, err = gdi.NewProc("EndPage").Call(dc)
		if int32(ok) <= 0 {
			return fmt.Errorf("EndPage: %v", err)
		}
	}
	ok, _, err = gdi.NewProc("EndDoc").Call(dc)
	if int32(ok) <= 0 {
		return fmt.Errorf("EndDoc: %v", err)
	}
	completed = true
	return nil
}
