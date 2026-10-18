import type {LabelDocument, LabelObject} from '../core';

export const DOTS_PER_INCH = 25.4;

export function mmToDots(mm: number, dpi: number): number {
  return Math.round(mm * (dpi / DOTS_PER_INCH));
}

export function dotsToMm(dots: number, dpi: number): number {
  return dots / (dpi / DOTS_PER_INCH);
}

export function calculateModuleDots(targetModuleMm: number, dpi: number): {
  moduleDots: number;
  actualModuleMm: number;
  warning?: string;
} {
  const dotsPerMm = dpi / DOTS_PER_INCH;
  const moduleDots = Math.max(1, Math.round(targetModuleMm * dotsPerMm));
  const actualModuleMm = moduleDots / dotsPerMm;
  let warning: string | undefined;

  if (dpi <= 203 && moduleDots < 2) {
    warning = `ที่ความละเอียด ${dpi} DPI ความกว้างแท่งคือ ${moduleDots} จุด (${actualModuleMm.toFixed(2)} มม.) ซึ่งบางกว่า 2 จุด อาจทำให้เครื่องสแกนบาร์โค้ดอ่านยาก แนะนำให้ปรับขนาดแท่งอย่างน้อย 0.25 มม.`;
  }

  return {moduleDots, actualModuleMm, warning};
}

export function calculateBitmapDimensions(widthMm: number, heightMm: number, dpi: number): {
  exactWidthDots: number;
  widthDots: number;
  heightDots: number;
  bytesPerRow: number;
} {
  const dotsPerMm = dpi / DOTS_PER_INCH;
  const exactWidthDots = Math.round(widthMm * dotsPerMm);
  const heightDots = Math.round(heightMm * dotsPerMm);
  // Bitmap width in bytes must be a multiple of 8 dots (1 byte = 8 dots)
  const widthDots = Math.ceil(exactWidthDots / 8) * 8;
  const bytesPerRow = widthDots / 8;
  return {exactWidthDots, widthDots, heightDots, bytesPerRow};
}

export interface QuietZoneCheckResult {
  valid: boolean;
  warnings: string[];
}

export function checkQuietZones(doc: LabelDocument, dpi: number = 203): QuietZoneCheckResult {
  const warnings: string[] = [];
  const dotsPerMm = dpi / DOTS_PER_INCH;

  for (const obj of doc.objects) {
    if (obj.kind !== 'barcode') continue;
    const barcode = obj;
    const symbology = (barcode.symbology ?? 'code128').toLowerCase();

    // Module calculation from scale or width
    const moduleMm = barcode.barcodeScale ? ((barcode.barcodeScale / 100) * 0.33) : Math.max(0.25, barcode.width / 120);
    let requiredLeftMm = 0;
    let requiredRightMm = 0;

    if (symbology.includes('ean')) {
      requiredLeftMm = 11 * moduleMm;
      requiredRightMm = 7 * moduleMm;
    } else if (symbology.includes('code128') || symbology.includes('code39') || symbology.includes('code93')) {
      requiredLeftMm = 10 * moduleMm;
      requiredRightMm = 10 * moduleMm;
    }

    if (requiredLeftMm > 0) {
      if (barcode.x < requiredLeftMm) {
        warnings.push(`บาร์โค้ด "${barcode.name}" อยู่ชิดขอบซ้ายเกินไป (${barcode.x.toFixed(1)} มม.) ต้องการ Quiet Zone อย่างน้อย ${requiredLeftMm.toFixed(1)} มม.`);
      }
      const rightMargin = doc.width - (barcode.x + barcode.width);
      if (rightMargin < requiredRightMm) {
        warnings.push(`บาร์โค้ด "${barcode.name}" อยู่ชิดขอบขวาเกินไป (${rightMargin.toFixed(1)} มม.) ต้องการ Quiet Zone อย่างน้อย ${requiredRightMm.toFixed(1)} มม.`);
      }
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
