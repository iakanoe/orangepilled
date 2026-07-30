"use client";

import { useEffect } from "react";
import type { DependencyList } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

/**
 * Subscribe to a Supabase realtime channel lazily — only once the browser goes
 * idle after first paint. Realtime is a non-critical enhancement: a slow or
 * failing websocket handshake must never block navigation or delay a page from
 * rendering. The connection is fire-and-forget and any setup error is ignored.
 *
 * `build` should return a configured channel (with its `.on(...)` handlers
 * attached) but must NOT call `.subscribe()` — this hook does that after idle.
 */
export function useDeferredRealtime(
  supabase: SupabaseClient,
  build: () => RealtimeChannel,
  deps: DependencyList,
) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let channel: RealtimeChannel | null = null;
    let cancelled = false;
    const supportsIdle = "requestIdleCallback" in window;
    let handle: number;

    const connect = () => {
      if (cancelled) return;
      try {
        channel = build();
        channel.subscribe();
      } catch {
        // Realtime is optional; swallow websocket/setup failures so the rest
        // of the app keeps working on a bad connection.
      }
    };

    handle = supportsIdle
      ? window.requestIdleCallback(connect, { timeout: 3000 })
      : window.setTimeout(connect, 1000);

    return () => {
      cancelled = true;
      if (supportsIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
