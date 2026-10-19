"use client"

import * as React from "react"

let cachedClockTime = typeof window !== "undefined" ? Date.now() : 0
const clockListeners = new Set<() => void>()
let clockIntervalId: ReturnType<typeof setInterval> | null = null

function ensureClockRunning() {
  if (typeof window === "undefined") return
  if (clockIntervalId === null && clockListeners.size > 0) {
    cachedClockTime = Date.now()
    clockIntervalId = setInterval(() => {
      cachedClockTime = Date.now()
      clockListeners.forEach((listener) => listener())
    }, 1000)
  }
}

function subscribeToClock(callback: () => void) {
  clockListeners.add(callback)
  ensureClockRunning()
  return () => {
    clockListeners.delete(callback)
    if (clockListeners.size === 0 && clockIntervalId !== null) {
      clearInterval(clockIntervalId)
      clockIntervalId = null
    }
  }
}

function getClockSnapshot() {
  return cachedClockTime
}

function getClockServerSnapshot() {
  return 0
}

/**
 * Custom React hook that subscribes to a shared 1-second clock store.
 * Safe for React 19 / Compiler purity rules and SSR prerendering.
 * Avoids infinite render loops by returning a cached immutable snapshot.
 */
export function useCurrentTime(): number {
  return React.useSyncExternalStore(
    subscribeToClock,
    getClockSnapshot,
    getClockServerSnapshot
  )
}
