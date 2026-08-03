"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { nativeNavigate } from "@/components/NativeTransitions";

// Goes back in history when possible (e.g. came from the dashboard), and
// falls back to a given route on a fresh load / no history.
export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Volver"
      onClick={() =>
        nativeNavigate("back", () => {
          if (window.history.length > 1) router.back();
          else router.push(fallback);
        })
      }
      className="icon-btn -ml-1"
    >
      <ArrowLeft className="h-5 w-5" aria-hidden />
    </button>
  );
}
