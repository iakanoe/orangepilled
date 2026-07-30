"use client";

import dynamic from "next/dynamic";

// Client-only heat grid map for the city-status view.
const CityMapInner = dynamic(() => import("@/components/CityMapInner"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100" aria-hidden />,
});

export default function CityMap() {
  return <CityMapInner />;
}
