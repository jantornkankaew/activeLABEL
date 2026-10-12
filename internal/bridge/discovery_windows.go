//go:build windows

package bridge

import (
	"encoding/binary"
	"errors"
	"fmt"
	"syscall"
	"unicode/utf16"
	"unsafe"
)

type printerInfo4 struct {
	Name, Server uintptr
	Attributes   uint32
}

func DiscoverPrinters() ([]Printer, error) {
	enum := syscall.NewLazyDLL("winspool.drv").NewProc("EnumPrintersW")
	var size, count uint32
	ok, _, err := enum.Call(6, 0, 4, 0, 0, uintptr(unsafe.Pointer(&size)), uintptr(unsafe.Pointer(&count)))
	if size == 0 {
		if ok != 0 {
			return []Printer{}, nil
		}
		return nil, fmt.Errorf("EnumPrintersW: %v", err)
	}
	for attempt := 0; attempt < 3; attempt++ {
		if size > 32*1024*1024 {
			return nil, errors.New("printer enumeration buffer exceeds limit")
		}
		buffer := make([]byte, int(size))
		ok, _, err = enum.Call(6, 0, 4, uintptr(unsafe.Pointer(&buffer[0])), uintptr(len(buffer)), uintptr(unsafe.Pointer(&size)), uintptr(unsafe.Pointer(&count)))
		if ok == 0 {
			if err == syscall.ERROR_INSUFFICIENT_BUFFER {
				continue
			}
			return nil, fmt.Errorf("EnumPrintersW: %v", err)
		}
		stride := unsafe.Sizeof(printerInfo4{})
		if count > 500 || uintptr(count)*stride > uintptr(len(buffer)) {
			return nil, errors.New("invalid printer enumeration result")
		}
		names := []string{}
		start := uintptr(unsafe.Pointer(&buffer[0]))
		end := start + uintptr(len(buffer))
		for i := uint32(0); i < count; i++ {
			p := (*printerInfo4)(unsafe.Pointer(&buffer[uintptr(i)*stride]))
			if p.Name < start || p.Name >= end || p.Name%2 != 0 {
				return nil, errors.New("invalid printer name pointer")
			}
			offset := int(p.Name - start)
			chars := []uint16{}
			terminated := false
			for offset+1 < len(buffer) && len(chars) < 512 {
				v := binary.LittleEndian.Uint16(buffer[offset : offset+2])
				if v == 0 {
					terminated = true
					break
				}
				chars = append(chars, v)
				offset += 2
			}
			if !terminated {
				return nil, errors.New("invalid printer name length")
			}
			names = append(names, string(utf16.Decode(chars)))
		}
		return nativePrinters(names, "windows_driver")
	}
	return nil, errors.New("printer queues changed during discovery; try again")
}
