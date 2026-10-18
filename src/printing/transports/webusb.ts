import type {Transport, TransportConfig, TransportType} from '../types';

export class WebUSBTransport implements Transport {
  readonly name = 'USB (WebUSB)';
  readonly type: TransportType = 'usb';
  private device: any = null;
  private endpointNumber: number = 1;
  private interfaceNumber: number = 0;
  private config: TransportConfig;

  constructor(config: TransportConfig = {type: 'usb'}) {
    this.config = config;
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
  }

  async connect(): Promise<void> {
    if (!WebUSBTransport.isSupported()) {
      throw new Error('เบราว์เซอร์นี้ไม่รองรับ WebUSB (แนะนำให้ใช้ Chrome หรือ Edge บน Desktop/Android)');
    }

    const filters: any[] = [{classCode: 7}]; // USB Printer Class 7
    if (this.config.vendorId) {
      filters.push({
        vendorId: parseInt(this.config.vendorId, 16),
        ...(this.config.productId ? {productId: parseInt(this.config.productId, 16)} : {}),
      });
    }

    try {
      this.device = await (navigator as any).usb.requestDevice({filters});
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        throw new Error('ไม่ได้เลือกอุปกรณ์ USB');
      }
      throw new Error(`การเชื่อมต่อ USB ล้มเหลว: ${err.message}`);
    }

    try {
      await this.device.open();
      if (!this.device.configuration) {
        await this.device.selectConfiguration(1);
      }

      // Search for Printer Interface (Class 7) or fallback to first interface
      let targetInterface = this.device.configuration.interfaces.find((iface: any) =>
        iface.alternates.some((alt: any) => alt.interfaceClass === 7)
      ) || this.device.configuration.interfaces[0];

      if (!targetInterface) {
        throw new Error('ไม่พบ Interface เครื่องพิมพ์บนอุปกรณ์ USB นี้');
      }

      this.interfaceNumber = targetInterface.interfaceNumber;
      await this.device.claimInterface(this.interfaceNumber);

      const alternate = targetInterface.alternates[0];
      const outEndpoint = alternate.endpoints.find((ep: any) => ep.direction === 'out' && ep.type === 'bulk')
        || alternate.endpoints.find((ep: any) => ep.direction === 'out');

      if (!outEndpoint) {
        throw new Error('ไม่พบช่องส่งข้อมูล (Bulk OUT Endpoint) ของเครื่องพิมพ์');
      }
      this.endpointNumber = outEndpoint.endpointNumber;
    } catch (err: any) {
      if (err.name === 'SecurityError' || err.message?.includes('Access denied')) {
        throw new Error('Windows หรือระบบปฏิบัติการกำลังใช้งานเครื่องพิมพ์นี้ผ่านไดรเวอร์ ทำให้เข้าถึงตรงไม่ได้ ให้เลือกพิมพ์ผ่านไดรเวอร์ระบบ หรือใช้โปรแกรม WinUSB');
      }
      throw new Error(`เปิดการเชื่อมต่อ USB ไม่สำเร็จ: ${err.message}`);
    }
  }

  async send(data: Uint8Array, onProgress?: (sent: number, total: number) => void): Promise<void> {
    if (!this.device || !this.device.opened) {
      throw new Error('เครื่องพิมพ์ USB ยังไม่ได้เชื่อมต่อ');
    }

    const chunkSize = 4096;
    let sent = 0;
    while (sent < data.length) {
      const chunk = data.slice(sent, sent + chunkSize);
      const res = await this.device.transferOut(this.endpointNumber, chunk);
      if (res.status !== 'ok') {
        throw new Error(`ส่งข้อมูล USB ไม่สำเร็จ สถานะ: ${res.status}`);
      }
      sent += chunk.length;
      onProgress?.(sent, data.length);
    }
  }

  async disconnect(): Promise<void> {
    if (this.device && this.device.opened) {
      try {
        await this.device.releaseInterface(this.interfaceNumber);
        await this.device.close();
      } catch {
        // Ignore close errors
      }
    }
    this.device = null;
  }

  isConnected(): boolean {
    return Boolean(this.device && this.device.opened);
  }
}
