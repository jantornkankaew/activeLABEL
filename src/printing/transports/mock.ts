import type {Transport, TransportType} from '../types';

export class MockTransport implements Transport {
  readonly name = 'Mock Hardware Transport';
  readonly type: TransportType = 'mock';
  private connected = false;
  public sentChunks: Uint8Array[] = [];

  async connect(): Promise<void> {
    this.connected = true;
  }

  async send(data: Uint8Array, onProgress?: (sent: number, total: number) => void): Promise<void> {
    if (!this.connected) {
      throw new Error('Mock transport is not connected');
    }
    this.sentChunks.push(new Uint8Array(data));
    onProgress?.(data.length, data.length);
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  clear(): void {
    this.sentChunks = [];
  }

  getAllSentBytes(): Uint8Array {
    const totalLength = this.sentChunks.reduce((acc, c) => acc + c.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.sentChunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    return combined;
  }
}
