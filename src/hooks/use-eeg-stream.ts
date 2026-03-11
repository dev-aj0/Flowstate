"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { EEGReading, FocusState } from '@/types';
import { wsManager } from '@/lib/websocket-manager';
import { getSettings } from '@/lib/storage';

interface WebSocketMessage {
  type: string;
  reading?: EEGReading;
  focusState?: FocusState;
  message?: string;
  museConnected?: boolean;
  mockMode?: boolean;
}

function generateMockReading(): EEGReading {
  const t = Date.now() / 1000;
  const alpha = 42 + 8 * Math.sin(t / 2.5) + (Math.random() - 0.5) * 4;
  const beta = alpha * (1.1 + 0.2 * Math.sin(t / 3) + (Math.random() - 0.5) * 0.1);
  return {
    timestamp: Date.now(),
    alpha: Math.max(10, Math.min(70, alpha)),
    beta: Math.max(15, Math.min(65, beta)),
    gamma: Math.max(8, Math.min(40, beta * 0.6 + (Math.random() - 0.5) * 5)),
    delta: Math.max(5, Math.min(25, alpha * 0.4 + (Math.random() - 0.5) * 3)),
    theta: Math.max(8, Math.min(30, alpha * 0.5 + (Math.random() - 0.5) * 2)),
  };
}

function focusFromReading(r: EEGReading): FocusState {
  const ratio = r.alpha > 0 ? r.beta / r.alpha : 0;
  const isFocused = ratio >= 1.2;
  // Match backend: confidence = min(ratio / threshold, 1)
  const confidence = Math.min(1, ratio / 1.2);
  return { isFocused, confidence, alertTriggered: false };
}

export function useEEGStream(isActive: boolean = false) {
  const [currentReading, setCurrentReading] = useState<EEGReading>({
    timestamp: Date.now(),
    alpha: 0,
    beta: 0,
    gamma: 0,
    delta: 0,
    theta: 0,
  });

  const [focusState, setFocusState] = useState<FocusState>({
    isFocused: false,
    confidence: 0,
    alertTriggered: false,
  });

  const [history, setHistory] = useState<EEGReading[]>([]);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [museError, setMuseError] = useState<string | null>(null);
  const [museConnected, setMuseConnected] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const receivedBackendData = useRef(false);
  const hasEverConnected = useRef(false);

  // Subscribe to WebSocket messages
  useEffect(() => {
    if (getSettings().useMockData) {
      setMockMode(true);
    }
    wsManager.connect();

    // Subscribe to messages
    const unsubscribe = wsManager.subscribe((data: WebSocketMessage) => {
      if (data.type === 'connected') {
        console.log('Backend connected:', data.message);
        if (data.museConnected !== undefined) {
          setMuseConnected(data.museConnected);
        } else {
          setMuseConnected(false);
        }
        if (data.mockMode !== undefined) {
          setMockMode(data.mockMode);
        }
        if (data.mockMode === true) {
          setMuseConnected(false);
        }
        // Always sync backend with current Settings so mock on/off matches user preference
        wsManager.send({ type: 'set_mock_mode', enabled: !!getSettings().useMockData });
      } else if (data.type === 'eeg_data' && data.reading && data.focusState) {
        receivedBackendData.current = true;
        setCurrentReading(data.reading);
        setFocusState(data.focusState);
        const isMock = data.mockMode === true;
        setMockMode(isMock);
        setMuseConnected(data.mockMode === false);
        setConnectionError(null);
        setMuseError(null);
        setHistory(prev => {
          const updated = [...prev, data.reading!];
          return updated.slice(-100);
        });
      } else if (data.type === 'muse_status') {
        if (data.museConnected !== undefined) {
          setMuseConnected(data.museConnected);
        }
        if (data.mockMode !== undefined) {
          setMockMode(data.mockMode);
        }
        if (data.message && !data.mockMode) {
          setMuseError(data.museConnected ? null : data.message);
        } else if (data.mockMode) {
          setMuseError(null);
        }
      } else if (data.type === 'error') {
        // Backend sent error (we're connected) — treat as Muse/LSL issue, not backend disconnect
        setMuseError(data.message || 'Muse stream error');
        setMuseConnected(false);
        setFocusState({
          isFocused: false,
          confidence: 0,
          alertTriggered: false,
        });
      } else if (data.type === 'pong') {
        // Keep-alive response
      }
    });

    // Subscribe to connection status
    // Only show "Backend disconnected" after we've connected at least once (avoids flash on initial load)
    const unsubscribeStatus = wsManager.subscribeStatus((isConnected) => {
      setConnected(isConnected);
      if (isConnected) {
        hasEverConnected.current = true;
        setConnectionError(null);
      } else if (hasEverConnected.current) {
        setConnectionError('Backend disconnected');
        setMuseError(null); // Clear Muse error when backend disconnects (connectionError takes priority)
      }
      // Else: still in initial connection phase, don't show error to avoid false alarm
    });

    // Fallback: if still not connected after 8s, show error (handles backend-down case)
    const connectionTimeout = setTimeout(() => {
      if (!hasEverConnected.current && !wsManager.connected) {
        setConnectionError('Backend disconnected');
      }
    }, 8000);

    // Send ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsManager.connected) {
        wsManager.send({ type: 'ping' });
      }
    }, 30000);

    return () => {
      unsubscribe();
      unsubscribeStatus();
      clearTimeout(connectionTimeout);
      clearInterval(pingInterval);
    };
  }, []);

  // When mock is enabled in Settings but backend isn't sending (or not connected), run client-side mock so UI shows data and "Connected"
  useEffect(() => {
    const useMock = getSettings().useMockData;
    if (!useMock) return;

    const start = Date.now();
    const fallbackMs = 800;

    const id = setInterval(() => {
      if (receivedBackendData.current) return;
      if (Date.now() - start < fallbackMs) return;

      const reading = generateMockReading();
      const focus = focusFromReading(reading);
      setCurrentReading(reading);
      setFocusState(focus);
      setMockMode(true);
      setMuseConnected(false);
      setHistory(prev => {
        const next = [...prev, reading];
        return next.slice(-100);
      });
    }, 200);

    return () => clearInterval(id);
  }, []);

  // Reset focus state when session becomes inactive
  useEffect(() => {
    if (!isActive) {
      setFocusState({
        isFocused: false,
        confidence: 0,
        alertTriggered: false,
      });
    }
  }, [isActive]);

  const resetHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // When backend is down, show connectionError. Otherwise show museError (backend can't find Muse).
  const displayError = connectionError ?? museError;

  return {
    currentReading,
    focusState,
    history,
    resetHistory,
    connected,
    museConnected,
    mockMode,
    connectionError: displayError,
  };
}
