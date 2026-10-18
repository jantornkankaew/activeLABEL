import type {MonochromeBitmap} from './types';
import {calculateBitmapDimensions} from './layout';

export interface RasterOptions {
  threshold?: number; // 0–255 (default 128)
  dither?: boolean;
}

/**
 * Converts standard RGBA pixel data to packed 1-bit monochrome bitmap.
 * In the resulting Uint8Array:
 * 1 = Black dot (ink)
 * 0 = White dot (background)
 * Each byte contains 8 horizontal pixels, MSB = leftmost pixel.
 */
export function rgbaToMonochromeBitmap(
  imageData: ImageData,
  targetWidthDots: number,
  targetHeightDots: number,
  bytesPerRow: number,
  options: RasterOptions = {}
): MonochromeBitmap {
  const threshold = options.threshold ?? 128;
  const dither = options.dither ?? false;
  const {width, height, data} = imageData;

  const out = new Uint8Array(bytesPerRow * targetHeightDots);

  if (dither) {
    // Floyd-Steinberg Error Diffusion Dithering
    // Work with a float luminance buffer
    const lum = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      // Convert transparent pixels to white (255)
      if (a < 128) {
        lum[i] = 255;
      } else {
        // Standard Rec. 601 luma
        lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
      }
    }

    for (let y = 0; y < height && y < targetHeightDots; y++) {
      const rowOffset = y * bytesPerRow;
      for (let x = 0; x < width && x < targetWidthDots; x++) {
        const idx = y * width + x;
        const oldVal = lum[idx];
        const newVal = oldVal < threshold ? 0 : 255;
        const err = oldVal - newVal;

        if (newVal === 0) {
          // Black pixel: set bit (1 = black)
          const byteIdx = rowOffset + Math.floor(x / 8);
          const bitIdx = 7 - (x % 8);
          out[byteIdx] |= (1 << bitIdx);
        }

        // Diffuse error
        if (x + 1 < width) lum[idx + 1] += err * (7 / 16);
        if (y + 1 < height) {
          if (x - 1 >= 0) lum[idx + width - 1] += err * (3 / 16);
          lum[idx + width] += err * (5 / 16);
          if (x + 1 < width) lum[idx + width + 1] += err * (1 / 16);
        }
      }
    }
  } else {
    // Simple direct luminance thresholding (crispest for barcodes and clean text)
    for (let y = 0; y < height && y < targetHeightDots; y++) {
      const rowOffset = y * bytesPerRow;
      for (let x = 0; x < width && x < targetWidthDots; x++) {
        const idx = (y * width + x) * 4;
        const a = data[idx + 3];
        if (a >= 128) {
          const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          if (luma < threshold) {
            // Black pixel
            const byteIdx = rowOffset + Math.floor(x / 8);
            const bitIdx = 7 - (x % 8);
            out[byteIdx] |= (1 << bitIdx);
          }
        }
      }
    }
  }

  return {
    widthDots: targetWidthDots,
    heightDots: targetHeightDots,
    bytesPerRow,
    data: out,
  };
}

/**
 * Rasterizes an SVG string into an 1-bit monochrome bitmap at physical printer DPI.
 */
export async function rasterizeSvgToBitmap(
  svgString: string,
  widthMm: number,
  heightMm: number,
  dpi: number,
  options: RasterOptions = {}
): Promise<MonochromeBitmap> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Font readiness fallback
    }
  }

  const {widthDots, heightDots, bytesPerRow} = calculateBitmapDimensions(widthMm, heightMm, dpi);

  // Convert SVG to data URL
  const blob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    const loadPromise = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(new Error('Failed to load SVG for rasterization: ' + e));
    });
    img.src = url;
    await loadPromise;

    // Use OffscreenCanvas if available, otherwise DOM canvas
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
    let canvasWidth = widthDots;
    let canvasHeight = heightDots;

    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
      ctx = canvas.getContext('2d', {willReadFrequently: true});
    } else if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      ctx = canvas.getContext('2d', {willReadFrequently: true});
    }

    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    // Disable image smoothing for crisp pixel rasterization
    ctx.imageSmoothingEnabled = false;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw SVG onto canvas
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    return rgbaToMonochromeBitmap(imageData, widthDots, heightDots, bytesPerRow, options);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Exports a MonochromeBitmap to a PNG Blob for user download (Layer 1 fallback).
 */
export async function exportMonochromePng(bitmap: MonochromeBitmap): Promise<Blob> {
  const {widthDots, heightDots, bytesPerRow, data} = bitmap;
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(widthDots, heightDots)
    : document.createElement('canvas');
  canvas.width = widthDots;
  canvas.height = heightDots;

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  if (!ctx) throw new Error('Canvas context unavailable');

  const imgData = ctx.createImageData(widthDots, heightDots);
  const px = imgData.data;

  for (let y = 0; y < heightDots; y++) {
    const rowOffset = y * bytesPerRow;
    for (let x = 0; x < widthDots; x++) {
      const byteIdx = rowOffset + Math.floor(x / 8);
      const bitIdx = 7 - (x % 8);
      const isBlack = (data[byteIdx] & (1 << bitIdx)) !== 0;
      const pIdx = (y * widthDots + x) * 4;
      const val = isBlack ? 0 : 255;
      px[pIdx] = val;
      px[pIdx + 1] = val;
      px[pIdx + 2] = val;
      px[pIdx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  if ('convertToBlob' in canvas && typeof canvas.convertToBlob === 'function') {
    return await canvas.convertToBlob({type: 'image/png'});
  } else if ('toBlob' in canvas && typeof (canvas as HTMLCanvasElement).toBlob === 'function') {
    return new Promise((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create PNG blob'));
      }, 'image/png');
    });
  }

  throw new Error('Unable to convert canvas to blob in current environment');
}
