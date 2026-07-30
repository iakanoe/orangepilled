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
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      ←
    </button>
  );
}
