package bridge

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	_ "image/png"
	"io"
	"net"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

type Printer struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Mode    string `json:"mode"`
	Address string `json:"address,omitempty"`
	DPI     int    `json:"dpi"`
}
type Job struct {
	JobID     string  `json:"jobId"`
	PrinterID string  `json:"printerId"`
	Copies    int     `json:"copies"`
	WidthMM   float64 `json:"widthMm"`
	HeightMM  float64 `json:"heightMm"`
	DPI       int     `json:"dpi"`
	PNG       string  `json:"pngBase64"`
}
type Record struct {
	JobID   string `json:"jobId"`
	Status  string `json:"status"`
	Hash    string `json:"hash"`
	Updated string `json:"updated"`
	Error   string `json:"error,omitempty"`
}
type Manager struct {
	Printers  []Printer
	Directory string
	mu        sync.Mutex
}

var idPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{1,80}$`)

func Decode(j Job) (image.Image, error) {
	if !idPattern.MatchString(j.JobID) || j.Copies < 1 || j.Copies > 100 || j.WidthMM < 10 || j.HeightMM < 10 || j.WidthMM > 300 || j.HeightMM > 300 {
		return nil, errors.New("invalid job geometry or copies")
	}
	if j.DPI != 203 && j.DPI != 300 && j.DPI != 600 {
		return nil, errors.New("unsupported DPI")
	}
	if len(j.PNG) > 12_000_000 {
		return nil, errors.New("image exceeds limit")
	}
	b, e := base64.StdEncoding.DecodeString(j.PNG)
	if e != nil {
		return nil, errors.New("invalid base64")
	}
	c, format, e := image.DecodeConfig(bytes.NewReader(b))
	if e != nil || format != "png" || c.Width <= 0 || c.Height <= 0 || int64(c.Width)*int64(c.Height) > 16_000_000 {
		return nil, errors.New("invalid PNG dimensions")
	}
	wantW := int(j.WidthMM*float64(j.DPI)/25.4 + .5)
	wantH := int(j.HeightMM*float64(j.DPI)/25.4 + .5)
	if c.Width != wantW || c.Height != wantH {
		return nil, errors.New("PNG dimensions do not match physical size and DPI")
	}
	im, _, e := image.Decode(bytes.NewReader(b))
	return im, e
}

// Each bit is one device dot. Thresholding is a prototype fallback; physical calibration is required.
func ZPL(im image.Image, copies int) []byte {
	b := im.Bounds()
	row := (b.Dx() + 7) / 8
	packed := make([]byte, row*b.Dy())
	for y := 0; y < b.Dy(); y++ {
		for x := 0; x < b.Dx(); x++ {
			r, g, bl, a := im.At(b.Min.X+x, b.Min.Y+y).RGBA() // blend transparent pixels on white
			lum := (299*uint64(r)+587*uint64(g)+114*uint64(bl))/1000 + uint64(65535-a)
			if lum < 32768 {
				packed[y*row+x/8] |= 1 << uint(7-x%8)
			}
		}
	}
	return []byte(fmt.Sprintf("^XA^PW%d^LL%d^FO0,0^GFA,%d,%d,%d,%s^FS^PQ%d^XZ", b.Dx(), b.Dy(), len(packed), len(packed), row, strings.ToUpper(hex.EncodeToString(packed)), copies))
}
func (m *Manager) path(id string) string { return filepath.Join(m.Directory, id+".json") }
func (m *Manager) save(r Record) error {
	b, e := json.Marshal(r)
	if e != nil {
		return e
	}
	tmp := m.path(r.JobID) + ".tmp"
	f, e := os.OpenFile(tmp, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if e != nil {
		return e
	}
	_, e = f.Write(b)
	if e == nil {
		e = f.Sync()
	}
	ce := f.Close()
	if e != nil {
		return e
	}
	if ce != nil {
		return ce
	}
	return os.Rename(tmp, m.path(r.JobID))
}
func (m *Manager) Submit(j Job) (Record, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	im, e := Decode(j)
	if e != nil {
		return Record{}, e
	}
	p := Printer{}
	for _, candidate := range m.Printers {
		if candidate.ID == j.PrinterID {
			p = candidate
			break
		}
	}
	if p.ID == "" || (p.DPI != 0 && p.DPI != j.DPI) {
		return Record{}, errors.New("printer is not configured or DPI does not match")
	}
	b, _ := json.Marshal(j)
	hash := fmt.Sprintf("%x", sha256.Sum256(b))
	if old, e := os.ReadFile(m.path(j.JobID)); e == nil {
		var r Record
		if json.Unmarshal(old, &r) != nil {
			return Record{}, errors.New("corrupt job record")
		}
		if r.Hash != hash {
			return Record{}, errors.New("job ID already used with different content")
		}
		return r, nil
	} else if !os.IsNotExist(e) {
		return Record{}, e
	}
	r := Record{JobID: j.JobID, Status: "sending", Hash: hash, Updated: time.Now().UTC().Format(time.RFC3339)}
	if e = m.save(r); e != nil {
		return r, e
	}
	switch p.Mode {
	case "zpl_tcp":
		var conn net.Conn
		conn, e = net.DialTimeout("tcp", p.Address, 3*time.Second)
		if e == nil {
			e = conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if e == nil {
				packet := ZPL(im, j.Copies)
				for len(packet) > 0 {
					var n int
					n, e = conn.Write(packet)
					if e != nil {
						break
					}
					if n == 0 {
						e = io.ErrShortWrite
						break
					}
					packet = packet[n:]
				}
			}
			conn.Close()
		}
	case "windows_driver", "macos_driver", "linux_driver":
		e = PrintDriver(p.Name, im, j)
	default:
		e = errors.New("unsupported printer adapter")
	}
	if e != nil {
		r.Status = "unknown_or_failed"
		r.Error = e.Error()
	} else if p.Mode == "windows_driver" || p.Mode == "macos_driver" || p.Mode == "linux_driver" {
		r.Status = "spooled"
	} else {
		r.Status = "transport_sent"
	}
	r.Updated = time.Now().UTC().Format(time.RFC3339)
	if se := m.save(r); se != nil {
		return r, fmt.Errorf("outcome record failed; do not auto retry: %w", se)
	}
	return r, nil
}
func ValidatePrinters(printers []Printer) error {
	ids := map[string]bool{}
	for _, p := range printers {
		if !idPattern.MatchString(p.ID) || ids[p.ID] || p.Name == "" {
			return errors.New("invalid printer config")
		}
		ids[p.ID] = true
		if p.DPI != 203 && p.DPI != 300 && p.DPI != 600 && !(p.DPI == 0 && (p.Mode == "windows_driver" || p.Mode == "macos_driver" || p.Mode == "linux_driver")) {
			return errors.New("invalid printer DPI")
		}
		if p.Mode == "zpl_tcp" {
			host, port, e := net.SplitHostPort(p.Address)
			if e != nil || net.ParseIP(host) == nil {
				return errors.New("TCP printer must use configured IP:port")
			}
			n, e := strconv.Atoi(port)
			if e != nil || n < 1 || n > 65535 {
				return errors.New("invalid TCP port")
			}
		} else if p.Mode != "windows_driver" && p.Mode != "macos_driver" && p.Mode != "linux_driver" {
			return errors.New("unsupported mode")
		}
	}
	return nil
}
