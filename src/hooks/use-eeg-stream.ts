"use client";

import { useState, useEffect, useCallback } from 'react';
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
  const [museConnected, setMuseConnected] = useState(false);
  const [mockMode, setMockMode] = useState(false);

  // Subscribe to WebSocket messages
  useEffect(() => {
    // Connect WebSocket manager
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
        setCurrentReading(data.reading);
        setFocusState(data.focusState);
        // Only show "Muse Connected" when backend explicitly says mockMode: false
        const isMock = data.mockMode === true;
        setMockMode(isMock);
        setMuseConnected(data.mockMode === false);
        setConnectionError(isMock ? 'Using mock data (no Muse)' : null);
        
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
        if (data.message) {
          setConnectionError(data.museConnected ? null : data.message);
        }
      } else if (data.type === 'error') {
        setConnectionError(data.message || 'Connection error');
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
    const unsubscribeStatus = wsManager.subscribeStatus((isConnected) => {
      setConnected(isConnected);
      if (!isConnected) {
        setConnectionError('Backend disconnected');
      } else {
        setConnectionError(null);
      }
    });

    // Send ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsManager.connected) {
        wsManager.send({ type: 'ping' });
      }
    }, 30000);

    return () => {
      unsubscribe();
      unsubscribeStatus();
      clearInterval(pingInterval);
    };
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

  return {
    currentReading,
    focusState,
    history,
    resetHistory,
    connected,
    museConnected,
    mockMode,
    connectionError,
  };
}
