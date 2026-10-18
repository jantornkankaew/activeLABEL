import type {Transport, TransportConfig, TransportType} from '../types';

export class WebSerialTransport implements Transport {
  readonly name = 'Serial / COM Port';
  readonly type: TransportType = 'serial';
  private port: any = null;
  private writer: any = null;
  private config: TransportConfig;

  constructor(config: TransportConfig = {type: 'serial'}) {
    this.config = config;
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  async connect(): Promise<void> {
    if (!WebSerialTransport.isSupported()) {
      throw new Error('เบราว์เซอร์นี้ไม่รองรับ Web Serial (แนะนำให้ใช้ Chrome หรือ Edge บน Desktop)');
    }

    try {
      this.port = await (navigator as any).serial.requestPort();
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        throw new Error('ไม่ได้เลือกพอร์ต Serial');
      }
      throw new Error(`การเลือกพอร์ตล้มเหลว: ${err.message}`);
    }

    const baudRate = this.config.baudRate ?? 115200;
    try {
      await this.port.open({baudRate});
    } catch (err: any) {
      throw new Error(`เปิดพอร์ต Serial ไม่สำเร็จ (Baud rate: ${baudRate}): ${err.message}`);
    }
  }

  async send(data: Uint8Array, onProgress?: (sent: number, total: number) => void): Promise<void> {
    if (!this.port || !this.port.writable) {
      throw new Error('พอร์ต Serial ยังไม่ได้เชื่อมต่อ');
    }

    const writer = this.port.writable.getWriter();
    try {
      const chunkSize = 2048;
      let sent = 0;
      while (sent < data.length) {
        const chunk = data.slice(sent, sent + chunkSize);
        await writer.write(chunk);
        sent += chunk.length;
        onProgress?.(sent, data.length);
      }
    } finally {
      writer.releaseLock();
    }
  }

  async disconnect(): Promise<void> {
    if (this.port) {
      try {
        await this.port.close();
      } catch {
        // Ignore close errors
      }
    }
    this.port = null;
  }

  isConnected(): boolean {
    return Boolean(this.port && this.port.readable);
  }
}
