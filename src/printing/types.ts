export type PrinterLanguage = 'tspl' | 'zpl' | 'epl' | 'cpcl' | 'escpos';
export type TransportType = 'usb' | 'serial' | 'ble' | 'bridge' | 'mock';

export interface LabelPreset {
  widthMm: number;
  heightMm: number;
  gapMm?: number;
}

export interface TransportConfig {
  type: TransportType;
  vendorId?: string;
  productId?: string;
  baudRate?: number;
  serviceUuid?: string;
  characteristicUuid?: string;
  bridgeUrl?: string;
}

export interface ProfileOptions {
  invertBitmap?: boolean;
  darkness?: number; // 0–15
  speed?: number; // 1–6 inches/sec
  offsetXDots?: number;
  offsetYDots?: number;
  chunkSize?: number;
  lineEnding?: '\r\n' | '\n';
  ditherImages?: boolean;
  threshold?: number; // 0–255 (default 128)
}

export interface PrinterProfile {
  id: string;
  name: string;
  language: PrinterLanguage;
  dpi: number;
  printableWidthMm?: number;
  labelPresets?: LabelPreset[];
  transports: TransportConfig[];
  options?: ProfileOptions;
  testedWith?: {
    os?: string;
    browser?: string;
    verifiedBy?: string;
    date?: string;
  };
}

export interface MonochromeBitmap {
  widthDots: number;
  heightDots: number;
  bytesPerRow: number;
  data: Uint8Array; // 1 = black, 0 = white
}

export interface DirectPrintJob {
  bitmap: MonochromeBitmap;
  copies: number;
  labelWidthMm: number;
  labelHeightMm: number;
  gapMm?: number;
  speed?: number;
  darkness?: number;
  offsetXDots?: number;
  offsetYDots?: number;
}

export interface Encoder {
  readonly language: PrinterLanguage;
  encode(job: DirectPrintJob, profile: PrinterProfile): Uint8Array;
}

export interface Transport {
  readonly name: string;
  readonly type: TransportType;
  connect(): Promise<void>;
  send(data: Uint8Array, onProgress?: (sent: number, total: number) => void): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}
