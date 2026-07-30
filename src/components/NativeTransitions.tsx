"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type Direction = "forward" | "back";
type Run = () => void;

// Set by the mounted provider; lets non-Link navigations (form submits, the
// back button, modal closes) animate through the same View Transition.
let sharedStart: ((direction: Direction, run: Run) => void) | null = null;

/** Run a programmatic navigation through the native page transition. */
export function nativeNavigate(direction: Direction, run: Run) {
  if (sharedStart) sharedStart(direction, run);
  else run();
}

// Drives native-feeling page transitions with the View Transitions API. Client
// navigations are wrapped in `document.startViewTransition`, and `<html>` is
// tagged with `data-nav` so CSS can slide the screens the right way (forward
// vs. back). The old/new screen snapshots animate simultaneously, giving a
// real iOS/Android push-pop instead of a hard cut.
export default function NativeTransitions() {
  const pathname = usePathname();
  const resolveRef = useRef<(() => void) | null>(null);

  // The route has committed — let the in-flight transition capture the new UI.
  useEffect(() => {
    resolveRef.current?.();
    resolveRef.current = null;
  }, [pathname]);

  useEffect(() => {
    const doc = document as Document & {
      startViewTransition?: (cb: () => Promise<void> | void) => {
        finished: Promise<void>;
      };
    };
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const start = (direction: Direction, run: Run) => {
      if (!doc.startViewTransition || reduced) {
        run();
        return;
      }
      const root = document.documentElement;
      root.dataset.nav = direction;
      const transition = doc.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            resolveRef.current = resolve;
            run();
            // Safety net so a no-op navigation can never freeze the page.
            window.setTimeout(() => {
              resolveRef.current?.();
              resolveRef.current = null;
            }, 700);
          }),
      );
      transition.finished.finally(() => {
        if (root.dataset.nav === direction) delete root.dataset.nav;
      });
    };

    sharedStart = start;

    return () => {
      if (sharedStart === start) sharedStart = null;
    };
  }, []);

  return null;
}
