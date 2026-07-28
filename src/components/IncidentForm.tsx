"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MapField from "@/components/MapField";
import type { LatLng } from "@/components/MapPicker";
import { uploadImages } from "@/lib/upload";
import { parsePatente, formatPatente } from "@/lib/patente";
import {
  INCIDENT_TYPES,
  ALERT_TYPES,
  SEVERIDAD_LABELS,
  type CatalogItem,
} from "@/lib/incident-types";

type Mode = "report" | "alert";

interface Props {
  mode: Mode;
  initialPatente?: string;
}

function nowLocalInput(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function IncidentForm({ mode, initialPatente = "" }: Props) {
  const router = useRouter();
  const isReport = mode === "report";
  const catalog: CatalogItem<string>[] = isReport ? INCIDENT_TYPES : ALERT_TYPES;

  const [patente, setPatente] = useState(initialPatente);
  const [tipo, setTipo] = useState<string>("");
  const [descripcion, setDescripcion] = useState("");
  const [severidad, setSeveridad] = useState<number>(0);
  const [showMap, setShowMap] = useState(false);
  const [pos, setPos] = useState<LatLng | null>(null);
  const [direccion, setDireccion] = useState<string | null>(null);
  const [ocurrido, setOcurrido] = useState(nowLocalInput());
  const [files, setFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | { kind: "ok"; notified: boolean; registered: boolean }
    | { kind: "queued" }
    | { kind: "error"; msg: string }
    | null
  >(null);

  const patenteParsed = parsePatente(patente);
  const patenteOk = patenteParsed.ok;
  const canSubmit = patenteOk && tipo && !submitting;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setResult(null);

    let fotos: string[] = [];
    if (files.length) {
      fotos = await uploadImages(files, isReport ? "reports" : "alerts");
    }

    const payload: Record<string, unknown> = {
      patente: patenteParsed.normalized,
      tipo,
      descripcion: descripcion || null,
      fotos,
      lat: pos?.lat ?? null,
      lng: pos?.lng ?? null,
      direccion,
    };
    if (isReport) {
      payload.severidad = severidad || null;
      payload.ocurrido_en = new Date(ocurrido).toISOString();
    }

    try {
      const res = await fetch(isReport ? "/api/reports" : "/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 202 && data.queued) {
        setResult({ kind: "queued" });
      } else if (res.ok) {
        setResult({
          kind: "ok",
          notified: !!data.ownerNotified,
          registered: !!data.vehicleRegistered,
        });
        // Reset transient fields for a possible next entry.
        setTipo("");
        setDescripcion("");
        setFiles([]);
      } else {
        setResult({ kind: "error", msg: data.error ?? "Error al enviar" });
      }
    } catch {
      // Network died before SW handled it (rare) — treat as queued.
      setResult({ kind: "queued" });
    } finally {
      setSubmitting(false);
    }
  }

  if (result && result.kind !== "error") {
    return (
      <div className="p-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-green-100 text-3xl">
            {result.kind === "queued" ? "📥" : "✅"}
          </div>
          <h2 className="text-lg font-bold">
            {result.kind === "queued"
              ? "Guardado sin conexión"
              : isReport
                ? "Reporte enviado"
                : "Aviso enviado"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {result.kind === "queued"
              ? "Se enviará automáticamente cuando vuelva internet."
              : result.notified
                ? "El dueño del vehículo fue notificado al instante."
                : result.registered
                  ? "Registrado. El dueño verá el reporte."
                  : "Registrado. Esta patente todavía no tiene dueño en la app."}
          </p>
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setResult(null)}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold"
            >
              Cargar otro
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 p-4">
      {/* Patente */}
      <div>
        <label className="mb-1 block text-sm font-medium">Patente</label>
        <input
          value={patente}
          onChange={(e) => setPatente(e.target.value.toUpperCase())}
          placeholder="AB123CD"
          autoCapitalize="characters"
          className={`w-full rounded-lg border px-3 py-2.5 font-mono text-lg tracking-wider outline-none ${
            patente && !patenteOk
              ? "border-red-400"
              : patenteOk
                ? "border-green-500"
                : "border-gray-300"
          }`}
        />
        {patente && !patenteOk && (
          <p className="mt-1 text-xs text-red-500">
            Formato inválido. Ej: ABC123 o AB123CD.
          </p>
        )}
        {patenteOk && (
          <p className="mt-1 text-xs text-green-600">
            {formatPatente(patente)} ✓
          </p>
        )}
      </div>

      {/* Tipo */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          {isReport ? "Tipo de incidente" : "¿Qué pasa con el vehículo?"}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {catalog.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setTipo(c.value)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm ${
                tipo === c.value
                  ? "border-brand-500 bg-brand-50 font-semibold"
                  : "border-gray-200 bg-white"
              }`}
            >
              <span className="text-lg">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Severidad (solo report) */}
      {isReport && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            Severidad <span className="text-gray-400">(opcional)</span>
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSeveridad(severidad === n ? 0 : n)}
                className={`flex-1 rounded-lg border py-2 text-xs ${
                  severidad >= n && severidad > 0
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-200"
                }`}
                title={SEVERIDAD_LABELS[n]}
              >
                {"⚠️".repeat(1)} {n}
              </button>
            ))}
          </div>
          {severidad > 0 && (
            <p className="mt-1 text-xs text-gray-500">{SEVERIDAD_LABELS[severidad]}</p>
          )}
        </div>
      )}

      {/* Descripcion */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          Descripción <span className="text-gray-400">(opcional)</span>
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          placeholder="Contá qué pasó…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>

      {/* Fecha/hora (solo report) */}
      {isReport && (
        <div>
          <label className="mb-1 block text-sm font-medium">Fecha y hora</label>
          <input
            type="datetime-local"
            value={ocurrido}
            onChange={(e) => setOcurrido(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
      )}

      {/* Fotos */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          Foto(s) <span className="text-gray-400">(opcional)</span>
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
          className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
        />
        {files.length > 0 && (
          <p className="mt-1 text-xs text-gray-500">{files.length} archivo(s)</p>
        )}
      </div>

      {/* Ubicacion */}
      <div>
        {!showMap ? (
          <button
            type="button"
            onClick={() => setShowMap(true)}
            className="w-full rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-600"
          >
            📍 Agregar ubicación (opcional)
          </button>
        ) : (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium">Ubicación</label>
              <button
                type="button"
                onClick={() => {
                  setShowMap(false);
                  setPos(null);
                  setDireccion(null);
                }}
                className="text-xs text-gray-400 underline"
              >
                Quitar
              </button>
            </div>
            <MapField
              value={pos}
              onChange={(v, dir) => {
                setPos(v);
                setDireccion(dir);
              }}
            />
            {direccion && (
              <p className="mt-1 text-xs text-gray-500">{direccion}</p>
            )}
          </div>
        )}
      </div>

      {result?.kind === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {result.msg}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="sticky bottom-24 rounded-xl bg-brand-600 py-3 font-semibold text-white shadow-lg disabled:opacity-50"
      >
        {submitting
          ? "Enviando…"
          : isReport
            ? "Enviar reporte"
            : "Enviar aviso"}
      </button>
    </form>
  );
}
