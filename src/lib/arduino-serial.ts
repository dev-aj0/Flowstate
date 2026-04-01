/**
 * Web Serial bridge to Seeed XIAO (or any USB-serial board) for wrist vibration.
 * Requires Chromium-based browser (Chrome, Edge) and HTTPS or localhost.
 */

export {};

declare global {
  interface SerialPort extends EventTarget {
    readonly readable: ReadableStream<Uint8Array> | null;
    readonly writable: WritableStream<Uint8Array> | null;
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
  }
  interface Serial {
    requestPort(options?: {
      filters?: Array<{ usbVendorId?: number; usbProductId?: number }>;
    }): Promise<SerialPort>;
    getPorts(): Promise<SerialPort>;
  }
  interface Navigator {
    serial?: Serial;
  }
}

const BAUD = 115200;
const VIBRATE_LINE = 'V\n';

let port: SerialPort | null = null;
let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;

const encoder = new TextEncoder();

export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.serial;
}

export function isArduinoSerialConnected(): boolean {
  return writer != null && port != null;
}

export async function connectArduinoSerial(): Promise<void> {
  if (!navigator.serial) {
    throw new Error('Web Serial is not supported in this browser. Use Chrome or Edge.');
  }
  await disconnectArduinoSerial();
  const p = await navigator.serial.requestPort();
  await p.open({ baudRate: BAUD });
  if (!p.writable) {
    await p.close().catch(() => {});
    throw new Error('Serial port has no writable stream');
  }
  port = p;
  writer = p.writable.getWriter();
}

export async function disconnectArduinoSerial(): Promise<void> {
  if (writer) {
    try {
      writer.releaseLock();
    } catch {
      /* ignore */
    }
    writer = null;
  }
  if (port) {
    try {
      await port.close();
    } catch {
      /* ignore */
    }
    port = null;
  }
}

/** Fire a short vibration pulse on the device (Arduino handles duration). */
export async function sendArduinoVibrate(): Promise<void> {
  if (!writer) {
    throw new Error(
      'Browser is not connected to the XIAO. In Settings → Alerts, click "Connect USB device" and choose the board. ' +
        'Quit Arduino IDE or close Serial Monitor first — only one program can use the COM port.'
    );
  }
  try {
    await writer.write(encoder.encode(VIBRATE_LINE));
  } catch (e) {
    console.warn('Arduino serial write failed:', e);
    await disconnectArduinoSerial();
    throw e instanceof Error ? e : new Error('Serial write failed');
  }
}
