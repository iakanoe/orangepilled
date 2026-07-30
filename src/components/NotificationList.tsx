"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { useDeferredRealtime } from "@/lib/realtime";
import { formatPatente } from "@/lib/patente";

const MiniMap = dynamic(() => import("@/components/MiniMap"), { ssr: false });

export interface NotifItem {
  id: string;
  leido: boolean;
  created_at: string;
  origen: "report" | "alert";
  emoji: string;
  label: string;
  patente: string;
  descripcion: string | null;
  lat: number | null;
  lng: number | null;
  direccion: string | null;
  image: string | null;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationList({
  initial,
}: {
  initial: NotifItem[];
}) {
  const router = useRouter();
  // Stable client so the realtime channel isn't recreated each render.
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  // Notifications the user read locally, so a refresh doesn't flash them
  // back to unread before the DB update propagates.
  const readRef = useRef<Set<string>>(new Set());

  // Re-sync when the server re-renders with fresh data (e.g. after a new
  // notification triggers router.refresh), preserving local read state.
  useEffect(() => {
    setItems(
      initial.map((i) =>
        readRef.current.has(i.id) ? { ...i, leido: true } : i,
      ),
    );
  }, [initial]);

  // Realtime: when a new notification lands, pull the freshly assembled list
  // (the row alone lacks the joined report/alert + media the UI needs).
  // Deferred so a slow/failing websocket never blocks navigation.
  useDeferredRealtime(
    supabase,
    () =>
      supabase
        .channel("notifications-center")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          () => router.refresh(),
        ),
    [supabase, router],
  );

  const unread = items.filter((i) => !i.leido).length;

  async function markRead(id: string) {
    readRef.current.add(id);
    setItems((xs) => xs.map((i) => (i.id === id ? { ...i, leido: true } : i)));
    await supabase.from("notifications").update({ leido: true }).eq("id", id);
  }

  async function markAll() {
    const ids = items.filter((i) => !i.leido).map((i) => i.id);
    if (!ids.length) return;
    ids.forEach((id) => readRef.current.add(id));
    setItems((xs) => xs.map((i) => ({ ...i, leido: true })));
    await supabase.from("notifications").update({ leido: true }).in("id", ids);
  }

  function toggle(item: NotifItem) {
    setOpen((o) => (o === item.id ? null : item.id));
    if (!item.leido) markRead(item.id);
  }

  if (!items.length) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p className="mb-3 text-4xl">🔔</p>
        No tenés notificaciones todavía.
      </div>
    );
  }

  return (
    <>
      {unread > 0 && (
        <div className="flex justify-end px-4 py-2">
          <button
            onClick={markAll}
            className="rounded text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 active:text-brand-800 dark:hover:text-brand-400"
          >
            Marcar todo como leído ({unread})
          </button>
        </div>
      )}
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => toggle(n)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors active:bg-gray-100 dark:active:bg-gray-800 ${
                n.leido
                  ? "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  : "bg-brand-50/50 hover:bg-brand-50 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
              }`}
            >
              <span className="text-xl">{n.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{n.label}</p>
                  {!n.leido && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                  )}
                </div>
                <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  {formatPatente(n.patente)}
                  <span className="ml-1 rounded bg-gray-100 px-1 text-[10px] uppercase dark:bg-gray-800">
                    {n.origen === "report" ? "reporte" : "aviso"}
                  </span>
                </p>
                {n.descripcion && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {n.descripcion}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                {fmt(n.created_at)}
              </span>
            </button>

            {open === n.id && (
              <div className="space-y-2 px-4 pb-4">
                {n.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.image}
                    alt="foto del reporte"
                    className="max-h-56 w-full rounded-lg object-cover"
                  />
                )}
                {n.lat != null && n.lng != null && (
                  <>
                    <MiniMap lat={n.lat} lng={n.lng} />
                    {n.direccion && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {n.direccion}
                      </p>
                    )}
                  </>
                )}
                {!n.image && n.lat == null && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Sin foto ni ubicación.
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
