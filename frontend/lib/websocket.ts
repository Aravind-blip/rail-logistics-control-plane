type EventCallback = (data: any) => void

const WS_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  .replace(/^http/, 'ws') + '/ws/live'

class WebSocketManager {
  private socket: WebSocket | null = null
  private listeners: Map<string, Set<EventCallback>> = new Map()
  private reconnectDelay = 1000
  private maxDelay = 30000
  private shouldConnect = false
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  connect(): void {
    this.shouldConnect = true
    this.open()
  }

  private open(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return
    }

    try {
      this.socket = new WebSocket(WS_URL)

      this.socket.onopen = () => {
        console.log('[WS] Connected to', WS_URL)
        this.reconnectDelay = 1000
      }

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          const type: string = msg.type || 'unknown'
          this.emit(type, msg)
          this.emit('*', msg)
        } catch {
          // ignore malformed messages
        }
      }

      this.socket.onclose = () => {
        console.log('[WS] Disconnected')
        if (this.shouldConnect) {
          this.scheduleReconnect()
        }
      }

      this.socket.onerror = (err) => {
        console.warn('[WS] Error', err)
        this.socket?.close()
      }
    } catch (err) {
      console.warn('[WS] Failed to open', err)
      if (this.shouldConnect) {
        this.scheduleReconnect()
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    const delay = this.reconnectDelay
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay)
    console.log(`[WS] Reconnecting in ${delay}ms`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.open()
    }, delay)
  }

  disconnect(): void {
    this.shouldConnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.socket?.close()
    this.socket = null
  }

  subscribe(type: string, cb: EventCallback): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(cb)
    return () => this.unsubscribe(type, cb)
  }

  unsubscribe(type: string, cb: EventCallback): void {
    this.listeners.get(type)?.delete(cb)
  }

  private emit(type: string, data: any): void {
    this.listeners.get(type)?.forEach((cb) => {
      try {
        cb(data)
      } catch (e) {
        console.error('[WS] Listener error', e)
      }
    })
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }
}

const wsManager = new WebSocketManager()
export default wsManager
