"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { nativeNavigate } from "@/components/NativeTransitions";

export default function PageHeader({
  title,
  subtitle,
  back = true,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
}) {
  const router = useRouter();
  return (
    <header className="app-bar">
      {back && (
        <button
          onClick={() => nativeNavigate("back", () => router.back())}
          aria-label="Volver"
          className="icon-btn -ml-1"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
      )}
      <div className="min-w-0">
        <h1 className="app-title truncate">{title}</h1>
        {subtitle && (
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
