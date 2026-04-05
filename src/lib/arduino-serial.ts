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
/** Line ending CRLF helps some USB-serial stacks; Arduino sketch trims to "V". */
const VIBRATE_LINE = 'V\r\n';

const encoder = new TextEncoder();

let port: SerialPort | null = null;
let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
let serialReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
let drainSerialReadLoop = false;

/** USB CDC can back up if the device sends (e.g. Serial.println) and the host never reads — second writes then fail. */
function startDrainingSerialInput(p: SerialPort) {
  stopDrainingSerialInput();
  if (!p.readable) return;
  try {
    serialReader = p.readable.getReader();
    drainSerialReadLoop = false;
    void (async () => {
      const r = serialReader;
      if (!r) return;
      try {
        for (;;) {
          if (drainSerialReadLoop) break;
          const { done, value } = await r.read();
          if (done) break;
          void value; // discard — keeps device TX from blocking
        }
      } catch {
        /* reader cancelled or port closed */
      }
    })();
  } catch {
    serialReader = null;
  }
}

function stopDrainingSerialInput() {
  drainSerialReadLoop = true;
  if (serialReader) {
    try {
      void serialReader.cancel();
    } catch {
      /* ignore */
    }
    try {
      serialReader.releaseLock();
    } catch {
      /* ignore */
    }
    serialReader = null;
  }
}

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
  startDrainingSerialInput(p);
}

export async function disconnectArduinoSerial(): Promise<void> {
  stopDrainingSerialInput();
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
    await writer.ready;
    await writer.write(encoder.encode(VIBRATE_LINE));
  } catch (e) {
    console.warn('Arduino serial write failed:', e);
    await disconnectArduinoSerial();
    throw e instanceof Error ? e : new Error('Serial write failed');
  }
}
