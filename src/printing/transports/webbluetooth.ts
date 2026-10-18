import type {Transport, TransportConfig, TransportType} from '../types';

export class WebBluetoothTransport implements Transport {
  readonly name = 'Bluetooth (BLE)';
  readonly type: TransportType = 'ble';
  private device: any = null;
  private characteristic: any = null;
  private config: TransportConfig;

  // Standard printer / serial BLE UUIDs
  private static readonly KNOWN_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer service
    '0000ffe0-0000-1000-8000-00805f9b34fb', // Common serial BLE service
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip / ISSC transparent service
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // PosBank / ESC-POS service
  ];

  constructor(config: TransportConfig = {type: 'ble'}) {
    this.config = config;
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect(): Promise<void> {
    if (!WebBluetoothTransport.isSupported()) {
      throw new Error('เบราว์เซอร์นี้ไม่รองรับ Web Bluetooth (แนะนำให้ใช้ Chrome หรือ Edge บน Desktop/Android หรือเบราว์เซอร์ Bluefy บน iOS)');
    }

    const services = [
      ...(this.config.serviceUuid ? [this.config.serviceUuid] : []),
      ...WebBluetoothTransport.KNOWN_SERVICES,
    ];

    try {
      this.device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: services,
      });
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        throw new Error('ไม่ได้เลือกอุปกรณ์ Bluetooth');
      }
      throw new Error(`การค้นหา Bluetooth ล้มเหลว: ${err.message}`);
    }

    try {
      const server = await this.device.gatt.connect();

      // Find first usable writable characteristic
      let targetChar: any = null;
      for (const serviceUuid of services) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const chars = await service.getCharacteristics();
          targetChar = chars.find((c: any) =>
            c.properties.writeWithoutResponse || c.properties.write
          );
          if (targetChar) break;
        } catch {
          // Continue to next service candidate
        }
      }

      if (!targetChar) {
        throw new Error('ไม่พบ Service หรือ Characteristic ที่สามารถส่งข้อมูลไปยังเครื่องพิมพ์ Bluetooth ได้');
      }

      this.characteristic = targetChar;
    } catch (err: any) {
      throw new Error(`เชื่อมต่อ Bluetooth GATT ไม่สำเร็จ: ${err.message}`);
    }
  }

  async send(data: Uint8Array, onProgress?: (sent: number, total: number) => void): Promise<void> {
    if (!this.characteristic) {
      throw new Error('เครื่องพิมพ์ Bluetooth ยังไม่ได้เชื่อมต่อ');
    }

    // BLE MTU typical payload limit is 128–256 bytes per chunk
    const chunkSize = 128;
    let sent = 0;
    while (sent < data.length) {
      const chunk = data.slice(sent, sent + chunkSize);
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      sent += chunk.length;
      onProgress?.(sent, data.length);
      // Small tick between BLE packets to prevent buffer overflow
      await new Promise(r => setTimeout(r, 10));
    }
  }

  async disconnect(): Promise<void> {
    if (this.device && this.device.gatt?.connected) {
      try {
        this.device.gatt.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
    this.device = null;
    this.characteristic = null;
  }

  isConnected(): boolean {
    return Boolean(this.device && this.device.gatt?.connected);
  }
}
