package bridge

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"
)

// Installed OS queues are the discovery allowlist. DPI is unknown until the user selects it.
func nativePrinters(names []string, mode string) ([]Printer, error) {
	if len(names) > 500 {
		return nil, errors.New("too many installed printer queues")
	}
	result := make([]Printer, 0, len(names))
	seen := map[string]bool{}
	for _, name := range names {
		if strings.TrimSpace(name) == "" || len(name) > 512 || strings.ContainsAny(name, "\x00\r\n") {
			return nil, errors.New("invalid installed printer name")
		}
		if seen[name] {
			continue
		}
		seen[name] = true
		sum := sha256.Sum256([]byte(mode + "\x00" + name))
		result = append(result, Printer{ID: "os_" + hex.EncodeToString(sum[:12]), Name: name, Mode: mode, DPI: 0})
	}
	return result, nil
}
func (m *Manager) ReplacePrinters(printers []Printer) error {
	if err := ValidatePrinters(printers); err != nil {
		return err
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	m.Printers = append([]Printer(nil), printers...)
	return nil
}
func parseCUPSNames(output string) []string {
	names := []string{}
	for _, line := range strings.Split(output, "\n") {
		fields := strings.Fields(line)
		if len(fields) >= 2 && fields[0] == "printer" {
			names = append(names, fields[1])
		}
	}
	return names
}
