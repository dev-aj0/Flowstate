"use client";

import { useEffect, useRef } from 'react';
import { sendArduinoVibrate } from '@/lib/arduino-serial';

/**
 * When distraction alert fires (same moment as the popup), pulse the wrist band.
 * Uses rising edge on alertTriggered so each distinct backend alert maps to one buzz.
 */
export function useArduinoWrist(options: {
  enabled: boolean;
  sessionActive: boolean;
  alertTriggered: boolean;
}) {
  const { enabled, sessionActive, alertTriggered } = options;
  const prevAlert = useRef(false);

  useEffect(() => {
    if (!enabled || !sessionActive) {
      prevAlert.current = alertTriggered;
      return;
    }
    const rising = alertTriggered && !prevAlert.current;
    prevAlert.current = alertTriggered;
    if (rising) {
      void sendArduinoVibrate().catch(() => {
        /* not connected or port busy — session continues without wrist buzz */
      });
    }
  }, [enabled, sessionActive, alertTriggered]);
}
