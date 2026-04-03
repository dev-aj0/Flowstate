'use client';

import { getSettings } from '@/lib/storage';
import {
  sendArduinoVibrate,
  isArduinoSerialConnected,
  isWebSerialSupported,
} from '@/lib/arduino-serial';
import {
  sendArduinoBleVibrate,
  isArduinoBleConnected,
  isWebBluetoothSupported,
} from '@/lib/arduino-ble';

export type WristTransport = 'usb' | 'ble';

export function getWristTransport(): WristTransport {
  return getSettings().wristBandTransport ?? 'usb';
}

export function isWristTransportSupported(): boolean {
  return getWristTransport() === 'ble'
    ? isWebBluetoothSupported()
    : isWebSerialSupported();
}

export function isWristConnected(): boolean {
  return getWristTransport() === 'ble'
    ? isArduinoBleConnected()
    : isArduinoSerialConnected();
}

/** Sends one buzz using the transport selected in Settings. */
export async function sendWristVibrate(): Promise<void> {
  if (getWristTransport() === 'ble') {
    return sendArduinoBleVibrate();
  }
  return sendArduinoVibrate();
}
