package bridge

import (
	"bytes"
	"compress/zlib"
	"fmt"
	"image"
	"strconv"
)

func labelPDF(im image.Image, widthMM, heightMM float64) ([]byte, error) {
	var compressed bytes.Buffer
	zip := zlib.NewWriter(&compressed)
	bounds := im.Bounds()
	row := make([]byte, bounds.Dx()*3)
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			r, g, b, a := im.At(x, y).RGBA()
			white := uint32(65535 - a)
			offset := (x - bounds.Min.X) * 3
			row[offset] = byte((r + white) >> 8)
			row[offset+1] = byte((g + white) >> 8)
			row[offset+2] = byte((b + white) >> 8)
		}
		if _, err := zip.Write(row); err != nil {
			return nil, err
		}
	}
	if err := zip.Close(); err != nil {
		return nil, err
	}
	width := strconv.FormatFloat(widthMM*72/25.4, 'f', 6, 64)
	height := strconv.FormatFloat(heightMM*72/25.4, 'f', 6, 64)
	content := []byte(fmt.Sprintf("q\n%s 0 0 %s 0 0 cm\n/Im0 Do\nQ\n", width, height))
	var pdf bytes.Buffer
	pdf.WriteString("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
	offsets := []int{0}
	object := func(number int, data []byte) {
		offsets = append(offsets, pdf.Len())
		fmt.Fprintf(&pdf, "%d 0 obj\n", number)
		pdf.Write(data)
		pdf.WriteString("\nendobj\n")
	}
	object(1, []byte("<< /Type /Catalog /Pages 2 0 R >>"))
	object(2, []byte("<< /Type /Pages /Count 1 /Kids [3 0 R] >>"))
	object(3, []byte(fmt.Sprintf("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %s %s] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>", width, height)))
	object(4, append(append([]byte(fmt.Sprintf("<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length %d >>\nstream\n", bounds.Dx(), bounds.Dy(), compressed.Len())), compressed.Bytes()...), []byte("\nendstream")...))
	object(5, append(append([]byte(fmt.Sprintf("<< /Length %d >>\nstream\n", len(content))), content...), []byte("endstream")...))
	xref := pdf.Len()
	fmt.Fprintf(&pdf, "xref\n0 6\n0000000000 65535 f \n")
	for _, offset := range offsets[1:] {
		fmt.Fprintf(&pdf, "%010d 00000 n \n", offset)
	}
	fmt.Fprintf(&pdf, "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", xref)
	return pdf.Bytes(), nil
}
