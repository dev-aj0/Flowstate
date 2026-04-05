/**
 * Web Bluetooth → Nordic UART RX on Seeed XIAO nRF52840 (Flowstate BLE sketch).
 * Chrome / Edge, HTTPS or localhost. User gesture required to pair.
 */

const NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

const encoder = new TextEncoder();

let device: BluetoothDevice | null = null;
let rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

function emitBleState(connected: boolean) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('flowstate-wrist-ble', { detail: { connected } })
  );
}

function onGattDisconnected() {
  rxCharacteristic = null;
  device = null;
  emitBleState(false);
}

/** Map browser/OS BLE errors to something actionable (Chrome often only says "Connection attempt failed"). */
function formatBleConnectError(e: unknown): Error {
  const msg =
    e instanceof Error ? e.message : typeof e === 'string' ? e : '';
  const name = e instanceof DOMException ? e.name : '';

  if (name === 'NotFoundError' || /cancel/i.test(msg)) {
    return new Error('No device selected.');
  }
  if (name === 'SecurityError') {
    return new Error('Bluetooth is blocked for this page. Use https:// or http://localhost and Chrome or Edge.');
  }
  if (
    name === 'NetworkError' ||
    /connection attempt failed/i.test(msg) ||
    /failed to connect/i.test(msg) ||
    /gatt.*error/i.test(msg)
  ) {
    return new Error(
      'Bluetooth connection failed. Try: (1) In Windows Settings → Bluetooth, remove any old pairing for this board, ' +
        '(2) turn Bluetooth off and on, (3) keep the XIAO close and powered, (4) use Chrome or Edge. ' +
        'If it still fails, connect by USB and use the USB cable option in Settings instead.'
    );
  }
  if (e instanceof Error) return e;
  return new Error(msg || 'Bluetooth connection failed');
}

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth;
}

export function isArduinoBleConnected(): boolean {
  return (
    rxCharacteristic != null &&
    device?.gatt != null &&
    device.gatt.connected === true
  );
}

export async function connectArduinoBle(): Promise<void> {
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth is not supported. Use Chrome or Edge on desktop.');
  }
  await disconnectArduinoBle();

  let picked: BluetoothDevice | null = null;
  try {
    /**
     * Many boards do not put the full Nordic UART 128-bit UUID in the advertisement packet, so
     * `filters: [{ services: [NUS] }]` hides the device or pairing fails. Listing all devices lets
     * you pick **FlowstateXIAO** (name from the BLE sketch) and then we discover NUS after connect.
     */
    picked = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [NUS_SERVICE],
    });

    picked.addEventListener('gattserverdisconnected', onGattDisconnected);

    const server = picked.gatt;
    if (!server) {
      throw new Error('GATT server unavailable');
    }
    const gatt = await server.connect();
    try {
      const service = await gatt.getPrimaryService(NUS_SERVICE);
      const rx = await service.getCharacteristic(NUS_RX);
      device = picked;
      rxCharacteristic = rx;
      emitBleState(true);
    } catch {
      throw new Error(
        'That device is not running the Flowstate BLE firmware (Nordic UART service not found). ' +
          'Upload hardware/seeed-xiao-vibration-ble/seeed-xiao-vibration-ble.ino and choose the device named FlowstateXIAO.'
      );
    }
  } catch (e) {
    if (picked) {
      picked.removeEventListener('gattserverdisconnected', onGattDisconnected);
      try {
        if (picked.gatt?.connected) await picked.gatt.disconnect();
      } catch {
        /* ignore */
      }
    }
    throw formatBleConnectError(e);
  }
}

export async function disconnectArduinoBle(): Promise<void> {
  if (device) {
    device.removeEventListener('gattserverdisconnected', onGattDisconnected);
    const gatt = device.gatt;
    if (gatt?.connected) {
      try {
        await gatt.disconnect();
      } catch {
        /* ignore */
      }
    }
  }
  device = null;
  rxCharacteristic = null;
  emitBleState(false);
}

/** Same payload as USB serial: V + newline (sketch accepts first char V). */
export async function sendArduinoBleVibrate(): Promise<void> {
  if (!rxCharacteristic) {
    throw new Error(
      'Bluetooth is not connected. In Settings → Alerts choose Bluetooth and click Connect BLE device.'
    );
  }
  const buf = encoder.encode('V\r\n');
  try {
    const props = rxCharacteristic.properties;
    if (props.writeWithoutResponse) {
      await rxCharacteristic.writeValueWithoutResponse(buf);
    } else {
      await rxCharacteristic.writeValue(buf);
    }
  } catch (e) {
    console.warn('BLE write failed:', e);
    await disconnectArduinoBle();
    throw e instanceof Error ? e : new Error('Bluetooth write failed');
  }
}
