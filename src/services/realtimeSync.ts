export interface SyncPayload {
  assets?: any[];
  repairRecords?: any[];
  planRecords?: any[];
  cycleRules?: any[];
  systemLogs?: any[];
  lastUpdated?: number;
}

type SyncCallback = (data: SyncPayload) => void;

class RealtimeSyncManager {
  private eventSource: EventSource | null = null;
  private listeners: Set<SyncCallback> = new Set();
  private isConnected = false;
  private reconnectTimer: any = null;
  private pollInterval: any = null;
  private lastKnownTimestamp = 0;
  private lastMessageReceivedAt = Date.now();
  private heartbeatInterval: any = null;
  private lastTouchPullTime = 0;

  constructor() {
    this.init();
  }

  public init() {
    this.connectSSE();
    this.startAdaptivePolling();
    this.setupWindowListeners();
  }

  public subscribe(cb: SyncCallback) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(data: SyncPayload) {
    this.lastMessageReceivedAt = Date.now();
    if (data.lastUpdated && data.lastUpdated <= this.lastKnownTimestamp) {
      // already up to date
      return;
    }
    if (data.lastUpdated) {
      this.lastKnownTimestamp = data.lastUpdated;
    }
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error('Error in sync listener callback:', err);
      }
    });
  }

  private connectSSE() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }

    try {
      this.eventSource = new EventSource('/api/sync/stream');

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.lastMessageReceivedAt = Date.now();
      };

      this.eventSource.onmessage = (event) => {
        try {
          this.lastMessageReceivedAt = Date.now();
          if (!event.data || event.data.trim() === '') return;
          const payload = JSON.parse(event.data);
          this.notify(payload);
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        try {
          this.eventSource?.close();
        } catch {}
        this.eventSource = null;

        // Fast reconnect in 2 seconds
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connectSSE();
        }, 2000);
      };
    } catch (err) {
      console.warn('Failed to start SSE stream:', err);
    }
  }

  private setupWindowListeners() {
    if (typeof window === 'undefined') return;

    // When smartphone unlocks or user switches back to browser tab
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkAndSyncNow();
        if (!this.isConnected || !this.eventSource) {
          this.connectSSE();
        }
      }
    });

    // Window focus (tap on screen / click inside app)
    window.addEventListener('focus', () => {
      this.checkAndSyncNow();
    });

    // Device recovers internet connection
    window.addEventListener('online', () => {
      this.connectSSE();
      this.checkAndSyncNow();
    });

    // Subtle touchstart throttle on mobile (checks once every 10s max on user action)
    window.addEventListener(
      'touchstart',
      () => {
        const now = Date.now();
        if (now - this.lastTouchPullTime > 8000) {
          this.lastTouchPullTime = now;
          this.checkAndSyncNow();
        }
      },
      { passive: true }
    );

    // Heartbeat supervisor: check if SSE stream is silent for > 22 seconds
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      const silentDuration = Date.now() - this.lastMessageReceivedAt;
      if (silentDuration > 22000 && document.visibilityState === 'visible') {
        // SSE may have hung silently in mobile OS socket suspension
        this.connectSSE();
        this.checkAndSyncNow();
      }
    }, 10000);
  }

  private startAdaptivePolling() {
    if (typeof window === 'undefined') return;
    if (this.pollInterval) clearInterval(this.pollInterval);

    // Fast 2-second background polling to ensure instant synchronization
    // even if cellular network/proxy interferes with long-running SSE
    this.pollInterval = setInterval(async () => {
      // If tab is hidden, slow down to 8s to conserve mobile battery
      if (document.visibilityState === 'hidden') return;
      await this.checkAndSyncNow();
    }, 2000);
  }

  public async checkAndSyncNow(): Promise<boolean> {
    try {
      const res = await fetch(`/api/sync/pull?since=${this.lastKnownTimestamp}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const result = await res.json();
        if (result.hasUpdates && result.data) {
          this.notify({ ...result.data, lastUpdated: result.lastUpdated });
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  public async pushUpdate(payload: SyncPayload): Promise<boolean> {
    try {
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.lastUpdated) {
          this.lastKnownTimestamp = result.lastUpdated;
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to push update to server:', err);
      return false;
    }
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      lastSync: this.lastKnownTimestamp,
    };
  }
}

export const realtimeSync = new RealtimeSyncManager();
