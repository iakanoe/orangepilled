"use client";

import { useRouter } from "next/navigation";

// Goes back in history when possible (e.g. came from the dashboard), and
// falls back to a given route on a fresh load / no history.
export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Volver"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="pressable grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg transition-colors hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700"
    >
      ←
    </button>
  );
}
