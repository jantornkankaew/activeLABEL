import type {Transport, TransportConfig} from '../types';
import {MockTransport} from './mock';
import {WebUSBTransport} from './webusb';
import {WebSerialTransport} from './webserial';
import {WebBluetoothTransport} from './webbluetooth';
import {LocalBridgeTransport} from './bridge';

export function createTransport(config: TransportConfig): Transport {
  switch (config.type) {
    case 'usb':
      return new WebUSBTransport(config);
    case 'serial':
      return new WebSerialTransport(config);
    case 'ble':
      return new WebBluetoothTransport(config);
    case 'bridge':
      return new LocalBridgeTransport(config);
    case 'mock':
      return new MockTransport();
    default:
      throw new Error(`ไม่รู้จักประเภท Transport "${(config as any).type}"`);
  }
}

export {
  MockTransport,
  WebUSBTransport,
  WebSerialTransport,
  WebBluetoothTransport,
  LocalBridgeTransport,
};
