export type StompSubscriptionCallback = (body: string) => void;

interface StompSub {
  id: string;
  destination: string;
  callback: StompSubscriptionCallback;
}

/**
 * Lightweight STOMP 1.2 WebSocket client using the browser's native WebSocket API.
 */
export class StompWsClient {
  private ws: WebSocket | null = null;
  private buffer = "";
  private subscriptions: StompSub[] = [];
  private connected = false;
  private disposed = false;
  private subCounter = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly onConnect?: () => void
  ) {}

  activate() {
    this.disposed = false;
    this.connectSocket();
  }

  deactivate() {
    this.disposed = true;
    this.connected = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send("DISCONNECT\n\n\0");
        }
        this.ws.close();
      } catch {
        // ignore close errors
      }
      this.ws = null;
    }
  }

  subscribe(destination: string, callback: StompSubscriptionCallback): () => void {
    const id = `sub-${++this.subCounter}`;
    const sub: StompSub = { id, destination, callback };
    this.subscriptions.push(sub);

    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscribe(sub);
    }

    return () => {
      this.subscriptions = this.subscriptions.filter((s) => s.id !== id);
      if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(`UNSUBSCRIBE\nid:${id}\n\n\0`);
      }
    };
  }

  private connectSocket() {
    if (this.disposed || typeof window === "undefined") return;

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      if (!this.ws || this.disposed) return;
      const connectFrame =
        `CONNECT\n` +
        `accept-version:1.2,1.1\n` +
        `heart-beat:10000,10000\n` +
        `Authorization:Bearer ${this.token}\n\n\0`;
      this.ws.send(connectFrame);
    };

    this.ws.onmessage = (event) => {
      const data = typeof event.data === "string" ? event.data : "";
      this.buffer += data;

      let nullIdx = this.buffer.indexOf("\0");
      while (nullIdx !== -1) {
        const rawFrame = this.buffer.slice(0, nullIdx);
        this.buffer = this.buffer.slice(nullIdx + 1);
        this.handleFrame(rawFrame);
        nullIdx = this.buffer.indexOf("\0");
      }

      // Trim bare heartbeat newlines when no partial frame is buffered
      if (this.buffer === "\n" || this.buffer === "\r\n") {
        this.buffer = "";
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      if (!this.disposed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose handles reconnect
    };
  }

  private handleFrame(raw: string) {
    const trimmed = raw.replace(/^[\r\n]+/, "");
    if (!trimmed) return;

    const splitIdx = trimmed.indexOf("\n\n");
    const headerBlock = splitIdx >= 0 ? trimmed.slice(0, splitIdx) : trimmed;
    const body = splitIdx >= 0 ? trimmed.slice(splitIdx + 2) : "";
    const lines = headerBlock.split(/\r?\n/);
    const command = lines[0]?.trim();

    const headers: Record<string, string> = {};
    for (let i = 1; i < lines.length; i++) {
      const colon = lines[i].indexOf(":");
      if (colon > 0) {
        const k = lines[i].slice(0, colon).trim();
        const v = lines[i].slice(colon + 1).trim();
        headers[k] = v;
      }
    }

    if (command === "CONNECTED") {
      this.connected = true;
      for (const sub of this.subscriptions) {
        this.sendSubscribe(sub);
      }
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send("\n");
        }
      }, 10000);
      this.onConnect?.();
    } else if (command === "MESSAGE") {
      const subId = headers["subscription"];
      const dest = headers["destination"];
      for (const sub of this.subscriptions) {
        if ((subId && sub.id === subId) || (!subId && dest === sub.destination)) {
          sub.callback(body);
        }
      }
    }
  }

  private sendSubscribe(sub: StompSub) {
    this.ws?.send(`SUBSCRIBE\nid:${sub.id}\ndestination:${sub.destination}\n\n\0`);
  }

  private scheduleReconnect() {
    if (this.disposed || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectSocket();
    }, 4000);
  }
}
