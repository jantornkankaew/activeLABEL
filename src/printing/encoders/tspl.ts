import type {DirectPrintJob, Encoder, PrinterProfile} from '../types';

export class TSPLEncoder implements Encoder {
  readonly language = 'tspl';

  encode(job: DirectPrintJob, profile: PrinterProfile): Uint8Array {
    const {bitmap, copies, labelWidthMm, labelHeightMm} = job;
    const gapMm = job.gapMm ?? profile.labelPresets?.[0]?.gapMm ?? 2;
    const speed = job.speed ?? profile.options?.speed ?? 4;
    const darkness = job.darkness ?? profile.options?.darkness ?? 8;
    const offsetX = job.offsetXDots ?? profile.options?.offsetXDots ?? 0;
    const offsetY = job.offsetYDots ?? profile.options?.offsetYDots ?? 0;
    const lineEnding = profile.options?.lineEnding ?? '\r\n';

    // TSPL standard mode 0 expects 0 = black dot, 1 = white dot.
    // Invert bitmap by default unless explicitly set to false.
    const shouldInvert = profile.options?.invertBitmap ?? true;

    // Header commands
    const headerLines = [
      `SIZE ${labelWidthMm} mm,${labelHeightMm} mm`,
      `GAP ${gapMm} mm,0 mm`,
      `SPEED ${speed}`,
      `DENSITY ${darkness}`,
      `DIRECTION 1,0`,
      `OFFSET 0 mm`,
      `CLS`,
      `BITMAP ${offsetX},${offsetY},${bitmap.bytesPerRow},${bitmap.heightDots},0,`,
    ];
    const headerStr = headerLines.join(lineEnding);
    const headerBytes = new TextEncoder().encode(headerStr);

    // Bitmap data
    const rawData = bitmap.data;
    const bitmapBytes = new Uint8Array(rawData.length);
    if (shouldInvert) {
      for (let i = 0; i < rawData.length; i++) {
        bitmapBytes[i] = ~rawData[i] & 0xff;
      }
    } else {
      bitmapBytes.set(rawData);
    }

    // Footer commands
    const footerStr = `${lineEnding}PRINT ${copies},1${lineEnding}`;
    const footerBytes = new TextEncoder().encode(footerStr);

    // Concatenate all bytes
    const totalLength = headerBytes.length + bitmapBytes.length + footerBytes.length;
    const result = new Uint8Array(totalLength);
    result.set(headerBytes, 0);
    result.set(bitmapBytes, headerBytes.length);
    result.set(footerBytes, headerBytes.length + bitmapBytes.length);

    return result;
  }
}
