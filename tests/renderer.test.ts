import test from 'node:test';
import assert from 'node:assert/strict';
import {object} from '../src/core';
import {barcodeSvg} from '../src/renderer';

test('QR, Code 128 and EAN render as vector SVG without invalid height options', () => {
  for (const [symbology, content] of [['qrcode', 'USER-QR-123'], ['code128', 'SKU001234'], ['ean13', '5901234123457']] as const) {
    const svg = barcodeSvg(object('barcode', {symbology, content}));
    assert(svg.includes('<svg') && svg.includes('<path'), `${symbology} must produce barcode geometry`);
  }
});
