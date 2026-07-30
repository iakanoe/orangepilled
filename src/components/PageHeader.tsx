"use client";

import { useRouter } from "next/navigation";

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
    <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
      {back && (
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="pressable grid h-8 w-8 place-items-center rounded-full text-lg transition-colors hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700"
        >
          ←
        </button>
      )}
      <div>
        <h1 className="text-lg font-bold leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
    </header>
  );
}
