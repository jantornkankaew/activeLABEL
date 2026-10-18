import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mmToDots,
  dotsToMm,
  calculateModuleDots,
  calculateBitmapDimensions,
  checkQuietZones,
  rgbaToMonochromeBitmap,
  getEncoder,
  TSPLEncoder,
  ZPLEncoder,
  MockTransport,
  createTransport,
  getAllProfiles,
  getProfileById,
  createCalibrationDocument,
  executeDirectPrint,
  type DirectPrintJob,
  type MonochromeBitmap,
} from '../src/printing';
import {seed} from '../src/core';

test('Layout: converts mm to dots and calculates module dots at device DPI', () => {
  // 203.2 DPI => ~8 dots/mm (203/25.4 = 7.992)
  // 50 mm at 203 DPI = 400 dots
  assert.equal(mmToDots(25.4, 203), 203);
  assert.equal(mmToDots(25.4, 300), 300);
  assert.equal(dotsToMm(203, 203), 25.4);

  // Module width rounding
  // At 203 DPI, 0.25 mm * 7.992 = 1.998 dots => rounded to 2 dots
  const mod2 = calculateModuleDots(0.25, 203);
  assert.equal(mod2.moduleDots, 2);
  assert.equal(mod2.warning, undefined);

  // At 203 DPI, 0.12 mm * 7.992 = 0.959 dots => rounded to 1 dot (should warn about scan difficulty)
  const mod1 = calculateModuleDots(0.12, 203);
  assert.equal(mod1.moduleDots, 1);
  assert.match(mod1.warning ?? '', /บางกว่า 2 จุด/);

  // Bitmap dimensions must round width up to multiple of 8 dots (1 byte per 8 dots)
  const dims = calculateBitmapDimensions(50, 30, 203);
  assert.equal(dims.exactWidthDots, 400);
  assert.equal(dims.widthDots % 8, 0);
  assert.equal(dims.bytesPerRow, dims.widthDots / 8);
});

test('Layout: checkQuietZones identifies barcodes too close to label edges', () => {
  const doc = seed(); // standard 50x30 mm with barcode at x=5
  const normalCheck = checkQuietZones(doc);
  assert.equal(normalCheck.valid, true);

  // Place barcode directly touching left margin (x=0.5)
  const crowdedDoc = {
    ...doc,
    objects: doc.objects.map(o => o.kind === 'barcode' ? {...o, x: 0.5, width: 35} : o),
  };
  const crowdedCheck = checkQuietZones(crowdedDoc);
  assert.equal(crowdedCheck.valid, false);
  assert.match(crowdedCheck.warnings[0], /Quiet Zone/);
});

test('Rasterizer: rgbaToMonochromeBitmap packs pixels into 1-bit monochrome data', () => {
  const width = 16;
  const height = 2;
  const bytesPerRow = 2; // 16 pixels = 2 bytes per row
  const raw = new Uint8ClampedArray(width * height * 4);

  // Row 0: alternate 8 black pixels, then 8 white pixels
  for (let x = 0; x < 8; x++) {
    const idx = x * 4;
    raw[idx] = 0; raw[idx + 1] = 0; raw[idx + 2] = 0; raw[idx + 3] = 255; // black
  }
  for (let x = 8; x < 16; x++) {
    const idx = x * 4;
    raw[idx] = 255; raw[idx + 1] = 255; raw[idx + 2] = 255; raw[idx + 3] = 255; // white
  }

  // Row 1: all 16 black pixels
  for (let x = 0; x < 16; x++) {
    const idx = (16 + x) * 4;
    raw[idx] = 0; raw[idx + 1] = 0; raw[idx + 2] = 0; raw[idx + 3] = 255; // black
  }

  const fakeImageData = {width, height, data: raw} as ImageData;
  const bitmap = rgbaToMonochromeBitmap(fakeImageData, width, height, bytesPerRow);

  assert.equal(bitmap.widthDots, 16);
  assert.equal(bitmap.heightDots, 2);
  assert.equal(bitmap.bytesPerRow, 2);
  assert.equal(bitmap.data.length, 4);

  // Row 0: first byte = 8 black bits (0xFF), second byte = 8 white bits (0x00)
  assert.equal(bitmap.data[0], 0xff);
  assert.equal(bitmap.data[1], 0x00);

  // Row 1: both bytes = 0xFF (all black)
  assert.equal(bitmap.data[2], 0xff);
  assert.equal(bitmap.data[3], 0xff);
});

test('Encoders: TSPL encoder generates correct commands and respects polarity', () => {
  const encoder = getEncoder('tspl');
  assert(encoder instanceof TSPLEncoder);

  const testBitmap: MonochromeBitmap = {
    widthDots: 16,
    heightDots: 2,
    bytesPerRow: 2,
    data: new Uint8Array([0xff, 0x00, 0xaa, 0x55]),
  };

  const profile = getProfileById('generic-tspl-203')!;
  const job: DirectPrintJob = {
    bitmap: testBitmap,
    copies: 2,
    labelWidthMm: 50,
    labelHeightMm: 30,
    gapMm: 2,
  };

  const bytes = encoder.encode(job, profile);
  const text = new TextDecoder().decode(bytes);

  assert.match(text, /SIZE 50 mm,30 mm/);
  assert.match(text, /GAP 2 mm,0 mm/);
  assert.match(text, /CLS/);
  assert.match(text, /BITMAP 0,0,2,2,0,/);
  assert.match(text, /PRINT 2,1/);

  // Verify binary payload: inverted when invertBitmap is true (default for TSPL)
  // Original byte 0 was 0xFF -> inverted becomes 0x00 (~0xFF & 0xFF)
  // Original byte 1 was 0x00 -> inverted becomes 0xFF
  const bitmapCmd = 'BITMAP 0,0,2,2,0,';
  const offset = text.indexOf(bitmapCmd) + bitmapCmd.length;
  assert.equal(bytes[offset], 0x00);
  assert.equal(bytes[offset + 1], 0xff);
});

test('Encoders: ZPL encoder generates valid ^XA ^GFA and ^XZ blocks', () => {
  const encoder = getEncoder('zpl');
  assert(encoder instanceof ZPLEncoder);

  const testBitmap: MonochromeBitmap = {
    widthDots: 16,
    heightDots: 2,
    bytesPerRow: 2,
    data: new Uint8Array([0xff, 0x00, 0x12, 0x34]),
  };

  const profile = getProfileById('generic-zpl-203')!;
  const job: DirectPrintJob = {
    bitmap: testBitmap,
    copies: 1,
    labelWidthMm: 50,
    labelHeightMm: 30,
  };

  const bytes = encoder.encode(job, profile);
  const text = new TextDecoder().decode(bytes);

  assert.match(text, /\^XA/);
  assert.match(text, /\^PW16/);
  assert.match(text, /\^LL2/);
  assert.match(text, /\^FO0,0\^GFA,4,4,2,FF001234\^FS/);
  assert.match(text, /\^PQ1,0,1,Y/);
  assert.match(text, /\^XZ/);
});

test('Profiles: registry includes built-in generic profiles and models', () => {
  const profiles = getAllProfiles();
  assert(profiles.length >= 6);

  const tspl203 = getProfileById('generic-tspl-203');
  assert(tspl203);
  assert.equal(tspl203.language, 'tspl');
  assert.equal(tspl203.dpi, 203);

  const zpl203 = getProfileById('generic-zpl-203');
  assert(zpl203);
  assert.equal(zpl203.language, 'zpl');
  assert.equal(zpl203.dpi, 203);

  const xprinter = getProfileById('xprinter-xp-365b');
  assert(xprinter);
  assert.equal(xprinter.language, 'tspl');

  const zebra = getProfileById('zebra-zd220');
  assert(zebra);
  assert.equal(zebra.language, 'zpl');
});

test('Calibration: createCalibrationDocument builds complete alignment and test pattern', () => {
  const calDoc = createCalibrationDocument(50, 30);
  assert.equal(calDoc.width, 50);
  assert.equal(calDoc.height, 30);
  assert(calDoc.objects.some(o => o.id === 'cal-border'));
  assert(calDoc.objects.some(o => o.id === 'cal-cross-h'));
  assert(calDoc.objects.some(o => o.id === 'cal-cross-v'));
  assert(calDoc.objects.some(o => o.id === 'cal-title' && o.content?.includes('ภาษาไทย')));
  assert(calDoc.objects.some(o => o.id === 'cal-barcode-1'));
  assert(calDoc.objects.some(o => o.id === 'cal-dark-4'));
});

test('Direct Print: executeDirectPrint connects and sends encoded data through MockTransport', async () => {
  const transport = createTransport({type: 'mock'}) as MockTransport;
  const profile = getProfileById('generic-tspl-203')!;

  const testBitmap: MonochromeBitmap = {
    widthDots: 16,
    heightDots: 2,
    bytesPerRow: 2,
    data: new Uint8Array([0xff, 0xff, 0x00, 0x00]),
  };

  const job: DirectPrintJob = {
    bitmap: testBitmap,
    copies: 3,
    labelWidthMm: 50,
    labelHeightMm: 30,
  };

  let progressCalled = false;
  await executeDirectPrint(job, profile, transport, (sent, total) => {
    progressCalled = true;
    assert(sent <= total);
  });

  assert.equal(transport.isConnected(), true);
  assert.equal(progressCalled, true);

  const sentBytes = transport.getAllSentBytes();
  assert(sentBytes.length > 0);
  const text = new TextDecoder().decode(sentBytes);
  assert.match(text, /SIZE 50 mm,30 mm/);
  assert.match(text, /PRINT 3,1/);

  await transport.disconnect();
  assert.equal(transport.isConnected(), false);
});
