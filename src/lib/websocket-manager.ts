/**
 * Shared WebSocket connection manager
 * Ensures only one WebSocket connection is maintained across all hook instances
 */

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001/ws';

type MessageHandler = (data: any) => void;
type StatusHandler = (connected: boolean) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;

  connect() {
    // Don't connect if already connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // Don't connect if already connecting (prevents duplicate connections)
    if (this.isConnecting) {
      return;
    }

    // Don't connect if in CONNECTING state
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Close any existing connection first (but only if not already closed)
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      try {
        this.ws.close();
      } catch (e) {
        // Ignore errors when closing
      }
      this.ws = null;
    }

    try {
      // Only log first connection attempt to reduce noise
      if (this.reconnectAttempts === 0) {
        console.log('🔌 Connecting to backend WebSocket:', WS_URL);
      }
      this.isConnecting = true;
      const ws = new WebSocket(WS_URL);
      this.ws = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected to backend');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyStatusHandlers(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyMessageHandlers(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        // Only log error on first attempt or every 5th attempt to reduce noise
        if (this.reconnectAttempts === 0 || this.reconnectAttempts % 5 === 0) {
          console.warn('⚠️ WebSocket connection failed. Is the backend running?');
        }
        this.isConnecting = false;
        this.notifyStatusHandlers(false);
      };

      ws.onclose = (event) => {
        // Only log if it's not a clean close
        if (event.code !== 1000 && this.reconnectAttempts === 0) {
          console.log('WebSocket disconnected. Code:', event.code);
        }
        this.isConnecting = false;
        this.ws = null;
        this.notifyStatusHandlers(false);

        // Reconnect if it wasn't a clean close
        if (event.code !== 1000) {
          if (this.reconnectAttempts < 10) {
            this.reconnectAttempts += 1;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
            // Only log every 5th reconnection attempt
            if (this.reconnectAttempts % 5 === 1) {
              console.log(`Retrying connection (attempt ${this.reconnectAttempts}/10)...`);
            }
            this.reconnectTimeout = setTimeout(() => {
              this.reconnectTimeout = null;
              this.connect();
            }, delay);
          } else if (this.reconnectAttempts === 10) {
            console.error('❌ Failed to connect after 10 attempts. Please ensure the backend is running on port 8000.');
          }
        }
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      this.isConnecting = false;
      this.notifyStatusHandlers(false);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    this.isConnecting = false;
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribe(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  subscribeStatus(handler: StatusHandler) {
    this.statusHandlers.add(handler);
    // Immediately notify of current status
    handler(this.ws?.readyState === WebSocket.OPEN);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  private notifyMessageHandlers(data: any) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  private notifyStatusHandlers(connected: boolean) {
    this.statusHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in status handler:', error);
      }
    });
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();

