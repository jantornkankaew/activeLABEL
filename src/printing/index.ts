import type {DirectPrintJob, PrinterProfile, Transport} from './types';
import {getEncoder} from './encoders';

export * from './types';
export * from './layout';
export * from './raster';
export * from './encoders';
export * from './transports';
export * from './profiles/registry';
export * from './calibration';

/**
 * High-level function to encode a direct print job and send it to the hardware transport.
 */
export async function executeDirectPrint(
  job: DirectPrintJob,
  profile: PrinterProfile,
  transport: Transport,
  onProgress?: (sent: number, total: number) => void
): Promise<void> {
  const encoder = getEncoder(profile.language);
  const data = encoder.encode(job, profile);

  if (!transport.isConnected()) {
    await transport.connect();
  }

  await transport.send(data, onProgress);
}
