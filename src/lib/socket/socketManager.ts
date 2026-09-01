import { io, Socket } from 'socket.io-client';

type SocketCallback<T = unknown> = (data: T) => void;

class SocketManager {
  private socket: Socket | null = null;
  private currentToken: string | null = null;
  private isReady = false;
  private listeners: Map<string, Set<SocketCallback>> = new Map();

  connect(token: string) {
    if (this.socket && this.currentToken === token) {
      return;
    }

    if (this.socket) {
      this.disconnect();
    }

    this.currentToken = token;
    this.isReady = false;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || 'http://localhost:3000';

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      // Transport connected, waiting for server room provisioning
    });

    this.socket.on('ready', () => {
      this.isReady = true;
      this.notifyListeners('socket:ready', true);
    });

    this.socket.on('disconnect', () => {
      this.isReady = false;
      this.notifyListeners('socket:ready', false);
    });

    this.socket.on('error', (err) => {
      this.notifyListeners('error', err);
    });

    // Forward backend socket events to subscribed listeners
    const eventNames = [
      'message:new',
      'message:pinned',
      'message:deleted',
      'conversation:new',
      'conversation:group:created',
      'conversation:group:updated',
      'conversation:group:deleted',
      'presence:update',
      'typing:start',
      'typing:stop',
    ];

    eventNames.forEach((eventName) => {
      this.socket?.on(eventName, (data) => {
        this.notifyListeners(eventName, data);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentToken = null;
    this.isReady = false;
  }

  getIsReady(): boolean {
    return this.isReady;
  }

  on(event: string, callback: SocketCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // If already ready and listening for ready event
    if (event === 'socket:ready' && this.isReady) {
      callback(true);
    }

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: SocketCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  private notifyListeners(event: string, data: unknown) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch {
          // Ignore listener error
        }
      });
    }
  }

  emitTypingStart(conversationId: string) {
    if (this.socket && this.isReady) {
      this.socket.emit('typing:start', { conversationId });
    }
  }

  emitTypingStop(conversationId: string) {
    if (this.socket && this.isReady) {
      this.socket.emit('typing:stop', { conversationId });
    }
  }
}

export const socketManager = new SocketManager();
