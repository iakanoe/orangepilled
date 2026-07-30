"use client";

import dynamic from "next/dynamic";

// Read-only mini map for notification / report detail views.
const MiniMapInner = dynamic(() => import("@/components/MiniMapInner"), {
  ssr: false,
  loading: () => (
    <div className="h-40 rounded-lg bg-gray-100 dark:bg-gray-800" aria-hidden />
  ),
});

export default function MiniMap(props: { lat: number; lng: number }) {
  return <MiniMapInner {...props} />;
}
