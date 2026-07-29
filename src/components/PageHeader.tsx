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
    <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
      {back && (
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="grid h-8 w-8 place-items-center rounded-full text-lg hover:bg-gray-100"
        >
          ←
        </button>
      )}
      <div>
        <h1 className="text-lg font-bold leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </header>
  );
}
