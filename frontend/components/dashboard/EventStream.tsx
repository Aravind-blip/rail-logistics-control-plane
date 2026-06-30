'use client'

import { useEffect, useRef, useState } from 'react'
import wsManager from '@/lib/websocket'
import { format } from 'date-fns'
import { clsx } from 'clsx'

interface StreamEvent {
  id: string
  type: string
  timestamp: string
  system_name?: string
  value?: string | number
  raw: any
}

const EVENT_COLORS: Record<string, string> = {
  alert: 'bg-red-500',
  system_update: 'bg-blue-500',
  workflow: 'bg-purple-500',
  heartbeat: 'bg-green-500',
  metric: 'bg-yellow-500',
  default: 'bg-gray-500',
}

function eventColor(type: string): string {
  for (const key of Object.keys(EVENT_COLORS)) {
    if (type.toLowerCase().includes(key)) return EVENT_COLORS[key]
  }
  return EVENT_COLORS.default
}

function summarize(event: any): string {
  if (event.data?.system_name) return event.data.system_name
  if (event.data?.name) return event.data.name
  if (event.data?.title) return event.data.title
  return ''
}

export default function EventStream() {
  const [events, setEvents] = useState<StreamEvent[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    wsManager.connect()
    const unsub = wsManager.subscribe('*', (msg) => {
      const ev: StreamEvent = {
        id: `${Date.now()}-${Math.random()}`,
        type: msg.type || 'unknown',
        timestamp: msg.timestamp || new Date().toISOString(),
        system_name: summarize(msg),
        raw: msg,
      }
      setEvents((prev) => [ev, ...prev].slice(0, 20))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    // Scroll to top since new events are prepended
  }, [events])

  return (
    <div className="h-64 overflow-y-auto space-y-1 pr-1">
      {events.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-600 text-sm">
          Waiting for live events…
        </div>
      ) : (
        events.map((ev) => (
          <div
            key={ev.id}
            className="flex items-start gap-2.5 py-1.5 px-2 rounded-md hover:bg-gray-700/50 transition-colors"
          >
            <div className="mt-1.5 flex-shrink-0">
              <span className={clsx('block h-2 w-2 rounded-full', eventColor(ev.type))} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">
                  {format(new Date(ev.timestamp), 'HH:mm:ss')}
                </span>
                <span className="text-xs font-medium text-gray-300 truncate">
                  {ev.type}
                </span>
                {ev.system_name && (
                  <span className="text-xs text-gray-500 truncate">— {ev.system_name}</span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  )
}
