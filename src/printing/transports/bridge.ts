import type {Transport, TransportConfig, TransportType} from '../types';

export class LocalBridgeTransport implements Transport {
  readonly name = 'Local Bridge (LAN/TCP 9100)';
  readonly type: TransportType = 'bridge';
  private bridgeUrl: string;
  private connected = false;

  constructor(config: TransportConfig = {type: 'bridge'}) {
    this.bridgeUrl = config.bridgeUrl || 'http://127.0.0.1:28171';
  }

  async connect(): Promise<void> {
    try {
      const res = await fetch(`${this.bridgeUrl}/v1/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) {
        throw new Error(`Print bridge ตอบกลับด้วยรหัส ${res.status}`);
      }
      this.connected = true;
    } catch (err: any) {
      this.connected = false;
      throw new Error(`ไม่สามารถเชื่อมต่อ Local Print Bridge ที่ ${this.bridgeUrl} ได้: ${err.message}`);
    }
  }

  async send(data: Uint8Array, onProgress?: (sent: number, total: number) => void): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const res = await fetch(`${this.bridgeUrl}/v1/raw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: data as unknown as BodyInit,
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`ส่งข้อมูลไปยัง Print Bridge ไม่สำเร็จ (${res.status}): ${body}`);
      }

      onProgress?.(data.length, data.length);
    } catch (err: any) {
      throw new Error(`เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง Print Bridge: ${err.message}`);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
