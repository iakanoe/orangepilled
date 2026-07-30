"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Pull distance (px) needed to trigger a refresh, and the max the content
// travels while dragging (with resistance applied to the raw finger delta).
const THRESHOLD = 70;
const MAX = 110;
// Safety net in case a refresh produces no observable pending transition.
const MAX_SPIN_MS = 5000;

export default function PullToRefresh({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const safetyTimer = useRef<number | null>(null);

  useEffect(() => {
    function setDistance(d: number) {
      pullRef.current = d;
      setPull(d);
    }

    function onStart(e: TouchEvent) {
      if (refreshingRef.current || window.scrollY > 0) return;
      // Ignore gestures that begin inside an open modal / dialog.
      if ((e.target as HTMLElement | null)?.closest('[role="dialog"]')) return;
      startY.current = e.touches[0].clientY;
    }

    function onMove(e: TouchEvent) {
      if (startY.current == null || refreshingRef.current) return;
      const dy = e.touches[0].clientY - startY.current;
      // Only a downward drag from the very top counts.
      if (dy <= 0 || window.scrollY > 0) {
        setDistance(0);
        return;
      }
      setDistance(Math.min(MAX, dy * 0.5));
      // Suppress native rubber-band / browser pull-to-refresh.
      if (e.cancelable) e.preventDefault();
    }

    function onEnd() {
      if (startY.current == null) return;
      startY.current = null;
      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        setDistance(THRESHOLD);
        // startTransition keeps isPending true until the server components
        // finish re-rendering, so the spinner shows the real refresh time.
        startTransition(() => router.refresh());
        safetyTimer.current = window.setTimeout(reset, MAX_SPIN_MS);
      } else {
        setDistance(0);
      }
    }

    function reset() {
      refreshingRef.current = false;
      setRefreshing(false);
      pullRef.current = 0;
      setPull(0);
      if (safetyTimer.current) {
        clearTimeout(safetyTimer.current);
        safetyTimer.current = null;
      }
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [router, startTransition]);

  // Precise completion: once the server refresh transition settles, snap back.
  useEffect(() => {
    if (refreshingRef.current && !isPending) {
      refreshingRef.current = false;
      setRefreshing(false);
      pullRef.current = 0;
      setPull(0);
      if (safetyTimer.current) {
        clearTimeout(safetyTimer.current);
        safetyTimer.current = null;
      }
    }
  }, [isPending]);

  const dragging = startY.current != null;
  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <div
      className="relative"
      style={{
        transform: `translateY(${pull}px)`,
        transition: dragging ? "none" : "transform 0.2s ease-out",
      }}
    >
      {/* Indicator sits just above the content, so it's revealed in the gap
          that opens under the (static) header as the content slides down. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
        style={{ transform: "translateY(-100%)" }}
      >
        <span
          className="mt-2 grid h-8 w-8 place-items-center rounded-full bg-white shadow dark:bg-gray-800"
          style={{ opacity: refreshing ? 1 : progress }}
        >
          <span
            className={`h-4 w-4 rounded-full border-2 border-gray-300 border-t-brand-600 dark:border-gray-600 dark:border-t-brand-400 ${
              refreshing ? "animate-spin" : ""
            }`}
            style={
              refreshing
                ? undefined
                : { transform: `rotate(${progress * 270}deg)` }
            }
          />
        </span>
      </div>
      {children}
    </div>
  );
}
