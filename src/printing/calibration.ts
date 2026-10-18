import {object, defaultDocumentSettings, type LabelDocument, type LabelObject} from '../core';

export function createCalibrationDocument(widthMm: number = 50, heightMm: number = 30): LabelDocument {
  const margin = 1.5;
  const contentWidth = widthMm - margin * 2;
  const contentHeight = heightMm - margin * 2;
  const centerX = widthMm / 2;
  const centerY = heightMm / 2;

  const objects: LabelObject[] = [
    // Outer alignment calibration border
    object('box', {
      id: 'cal-border',
      name: 'Calibration Border',
      x: margin,
      y: margin,
      width: contentWidth,
      height: contentHeight,
      locked: true,
    }),
    // Center alignment crosshairs
    object('line', {
      id: 'cal-cross-h',
      name: 'Center Crosshair H',
      x: centerX - 3,
      y: centerY,
      width: 6,
      height: 1,
      line: {startX: 0, startY: 0.5, endX: 6, endY: 0.5},
      locked: true,
    }),
    object('line', {
      id: 'cal-cross-v',
      name: 'Center Crosshair V',
      x: centerX,
      y: centerY - 3,
      width: 1,
      height: 6,
      line: {startX: 0.5, startY: 0, endX: 0.5, endY: 6},
      locked: true,
    }),
    // Thai and English Typography test
    object('text', {
      id: 'cal-title',
      name: 'Calibration Title',
      x: margin + 2,
      y: margin + 3.5,
      width: contentWidth - 4,
      height: 4,
      content: 'activeLABEL Test Print · ภาษาไทย สระอิ อี่ ปี่ ปู่',
      fontSize: 2.8,
      bold: true,
      fontName: 'Noto Sans Thai',
      locked: true,
    }),
    // Stepped barcodes test (Code 128)
    object('barcode', {
      id: 'cal-barcode-1',
      name: 'Barcode 1',
      x: margin + 2,
      y: margin + 8.5,
      width: Math.min(contentWidth - 4, 38),
      height: 8,
      content: 'TEST-1234',
      symbology: 'code128',
      locked: true,
    }),
    // Stepped density ladder blocks
    object('box', {
      id: 'cal-dark-1',
      name: 'Darkness 20%',
      x: margin + 2,
      y: heightMm - margin - 5,
      width: (contentWidth - 6) / 4,
      height: 3.5,
      locked: true,
    }),
    object('box', {
      id: 'cal-dark-2',
      name: 'Darkness 50%',
      x: margin + 2 + ((contentWidth - 6) / 4) + 1,
      y: heightMm - margin - 5,
      width: (contentWidth - 6) / 4,
      height: 3.5,
      locked: true,
    }),
    object('box', {
      id: 'cal-dark-3',
      name: 'Darkness 80%',
      x: margin + 2 + (((contentWidth - 6) / 4) + 1) * 2,
      y: heightMm - margin - 5,
      width: (contentWidth - 6) / 4,
      height: 3.5,
      locked: true,
    }),
    object('box', {
      id: 'cal-dark-4',
      name: 'Darkness 100%',
      x: margin + 2 + (((contentWidth - 6) / 4) + 1) * 3,
      y: heightMm - margin - 5,
      width: (contentWidth - 6) / 4,
      height: 3.5,
      locked: true,
    }),
    // Footer notes
    object('text', {
      id: 'cal-footer',
      name: 'Footer text',
      x: margin + 2,
      y: heightMm - margin - 1,
      width: contentWidth - 4,
      height: 2,
      content: `${widthMm}x${heightMm}mm · Alignment & Density Test`,
      fontSize: 1.8,
      bold: false,
      fontName: 'Noto Sans',
      locked: true,
    }),
  ];

  return {
    schemaVersion: 1,
    id: 'calibration-test-print',
    title: 'activeLABEL Test Print',
    width: widthMm,
    height: heightMm,
    revision: 1,
    settings: {
      ...defaultDocumentSettings,
    },
    objects,
  };
}
