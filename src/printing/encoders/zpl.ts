import type {DirectPrintJob, Encoder, PrinterProfile} from '../types';

export class ZPLEncoder implements Encoder {
  readonly language = 'zpl';

  encode(job: DirectPrintJob, profile: PrinterProfile): Uint8Array {
    const {bitmap, copies} = job;
    const speed = job.speed ?? profile.options?.speed ?? 4;
    const darkness = job.darkness ?? profile.options?.darkness ?? 15;
    const offsetX = job.offsetXDots ?? profile.options?.offsetXDots ?? 0;
    const offsetY = job.offsetYDots ?? profile.options?.offsetYDots ?? 0;
    const shouldInvert = profile.options?.invertBitmap ?? false;

    const totalBytes = bitmap.bytesPerRow * bitmap.heightDots;
    const rawData = bitmap.data;

    // Convert bitmap bytes to ASCII Hex
    const hexChars: string[] = new Array(totalBytes);
    for (let i = 0; i < totalBytes; i++) {
      const b = shouldInvert ? (~rawData[i] & 0xff) : rawData[i];
      hexChars[i] = b.toString(16).padStart(2, '0').toUpperCase();
    }
    const hexData = hexChars.join('');

    const zpl = [
      '^XA',
      `^PW${bitmap.widthDots}`,
      `^LL${bitmap.heightDots}`,
      `~SD${darkness}`,
      `^PR${speed}`,
      `^FO${offsetX},${offsetY}^GFA,${totalBytes},${totalBytes},${bitmap.bytesPerRow},${hexData}^FS`,
      `^PQ${copies},0,1,Y`,
      '^XZ',
    ].join('\n');

    return new TextEncoder().encode(zpl);
  }
}
