"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { useTranslations } from "next-intl";
import MapField from "@/components/MapField";
import type { LatLng } from "@/components/MapPicker";
import { uploadImagesWithFallback } from "@/lib/upload";
import { parsePatente, formatPatente } from "@/lib/patente";
import {
  INCIDENT_TYPES,
  ALERT_TYPES,
  SEVERIDAD_LABELS,
  type CatalogItem,
} from "@/lib/incident-types";
import {
  X,
  Camera,
  MapPin,
  TriangleAlert,
  CircleCheck,
  Download,
  Plus,
} from "lucide-react";

type Mode = "report" | "alert";

interface Props {
  mode: Mode;
  open: boolean;
  onClose: () => void;
  initialPatente?: string;
}

type StepId = "patente" | "cuando" | "donde" | "detalles";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Local date parts + hour/minute rounded to the nearest 5 min (past). */
function nowParts() {
  const d = new Date();
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    hour: d.getHours(),
    minute: Math.floor(d.getMinutes() / 5) * 5,
  };
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export default function IncidentWizard({
  mode,
  open,
  onClose,
  initialPatente = "",
}: Props) {
  const router = useRouter();
  const t = useTranslations("wizard");
  const tc = useTranslations("common");
  const isReport = mode === "report";
  const catalog: CatalogItem<string>[] = isReport
    ? INCIDENT_TYPES
    : ALERT_TYPES;

  // Live alerts skip the "where": the owner already knows where their car is.
  const steps: StepId[] = isReport
    ? ["patente", "cuando", "donde", "detalles"]
    : ["patente", "detalles"];

  const [mounted, setMounted] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  const [patente, setPatente] = useState(initialPatente);
  const [tipo, setTipo] = useState<string>("");
  const [descripcion, setDescripcion] = useState("");
  const [severidad, setSeveridad] = useState<number>(0);
  const [pos, setPos] = useState<LatLng | null>(null);
  const [direccion, setDireccion] = useState<string | null>(null);

  const init = nowParts();
  const [date, setDate] = useState(init.date);
  const [hour, setHour] = useState(init.hour);
  const [minute, setMinute] = useState(init.minute);

  const [files, setFiles] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | { kind: "ok"; notified: boolean; registered: boolean }
    | { kind: "queued" }
    | { kind: "error"; msg: string }
    | null
  >(null);

  // Portals need a client-side document.
  useEffect(() => setMounted(true), []);

  // Lock background scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // On mobile, the on-screen keyboard doesn't shrink 100dvh, so the footer
  // (with the Siguiente button) ends up hidden behind it. Track the visual
  // viewport height and size the modal to it so the footer stays visible.
  const [viewportH, setViewportH] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setViewportH(vv.height);
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setViewportH(null);
    };
  }, [open]);

  // Reset transient state whenever the modal is (re)opened.
  useEffect(() => {
    if (!open) return;
    const n = nowParts();
    setStepIdx(0);
    setPatente(initialPatente);
    setTipo("");
    setDescripcion("");
    setSeveridad(0);
    setPos(null);
    setDireccion(null);
    setDate(n.date);
    setHour(n.hour);
    setMinute(n.minute);
    setFiles([]);
    setSubmitting(false);
    setResult(null);
  }, [open, initialPatente]);

  if (!open || !mounted) return null;

  const patenteParsed = parsePatente(patente);
  const patenteOk = patenteParsed.ok;
  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  const canProceed =
    step === "patente"
      ? patenteOk
      : step === "donde"
        ? !!pos
        : step === "detalles"
          ? !!tipo
          : true; // "cuando" always has a value

  function setTimeFromNow(minutesAgo: number) {
    const d = new Date(Date.now() - minutesAgo * 60000);
    setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    setHour(d.getHours());
    setMinute(Math.floor(d.getMinutes() / 5) * 5);
  }

  function next() {
    if (!canProceed) return;
    if (!isLast) setStepIdx((i) => i + 1);
  }

  function back() {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  }

  async function submit() {
    if (!canProceed || submitting) return;
    setSubmitting(true);
    setResult(null);

    let fotos: string[] = [];
    let fotosPendientes: string[] = [];
    if (files.length) {
      const out = await uploadImagesWithFallback(
        files,
        isReport ? "reports" : "alerts",
      );
      fotos = out.fotos;
      fotosPendientes = out.pendientes;
    }

    const payload: Record<string, unknown> = {
      patente: patenteParsed.normalized,
      tipo,
      descripcion: descripcion || null,
      fotos,
      lat: pos?.lat ?? null,
      lng: pos?.lng ?? null,
      direccion,
      // Idempotency key: makes an offline replay safe (server dedupes on it).
      clientId: crypto.randomUUID(),
    };
    if (fotosPendientes.length) payload.fotosPendientes = fotosPendientes;
    if (isReport) {
      payload.severidad = severidad || null;
      payload.ocurrido_en = new Date(
        `${date}T${pad(hour)}:${pad(minute)}:00`,
      ).toISOString();
    }

    try {
      const res = await fetch(isReport ? "/api/reports" : "/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 202 && data.queued) {
        track("incident_queued", { mode });
        setResult({ kind: "queued" });
      } else if (res.ok) {
        track("incident_submitted", {
          mode,
          notified: !!data.ownersNotified,
          registered: !!data.vehicleRegistered,
          withPhotos: files.length > 0,
        });
        setResult({
          kind: "ok",
          notified: !!data.ownersNotified,
          registered: !!data.vehicleRegistered,
        });
        // Invalidate the client Router Cache so consultar/vehículos/reportes
        // reflect the new report on the next navigation instead of stale data.
        router.refresh();
      } else {
        track("incident_error", { mode, status: res.status });
        setResult({ kind: "error", msg: data.error ?? t("errorSend") });
      }
    } catch {
      // The fetch threw before any response arrived. If a service worker
      // controls the page it queued the request in the offline outbox;
      // otherwise nothing was saved and we must surface a real error instead
      // of a false "saved" message.
      if (
        typeof navigator !== "undefined" &&
        navigator.serviceWorker?.controller
      ) {
        track("incident_queued", { mode });
        setResult({ kind: "queued" });
      } else {
        setResult({
          kind: "error",
          msg: t("offline"),
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const title = isReport ? t("titleReport") : t("titleAlert");

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex bg-black/40"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-[100dvh] w-full max-w-lg flex-col bg-white dark:bg-gray-900"
        style={viewportH ? { height: `${viewportH}px` } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            aria-label={tc("cerrar")}
            className="icon-btn -ml-1"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{title}</p>
            {!result && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t("step", { current: stepIdx + 1, total: steps.length })}
              </p>
            )}
          </div>
        </div>

        {/* Progress */}
        {!result && (
          <div className="flex gap-1 px-4 pt-3">
            {steps.map((s, i) => (
              <span
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  i <= stepIdx ? "bg-brand-600" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>
        )}

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          {result ? (
            <ResultView
              result={result}
              isReport={isReport}
              onRetry={() => setResult(null)}
              onClose={onClose}
              onHome={onClose}
            />
          ) : step === "patente" ? (
            <PatenteStep
              patente={patente}
              setPatente={setPatente}
              patenteOk={patenteOk}
            />
          ) : step === "cuando" ? (
            <CuandoStep
              date={date}
              hour={hour}
              minute={minute}
              setDate={setDate}
              setHour={setHour}
              setMinute={setMinute}
              onQuick={setTimeFromNow}
            />
          ) : step === "donde" ? (
            <DondeStep
              pos={pos}
              direccion={direccion}
              onChange={(v, dir) => {
                setPos(v);
                setDireccion(dir);
              }}
            />
          ) : (
            <DetallesStep
              isReport={isReport}
              catalog={catalog}
              tipo={tipo}
              setTipo={setTipo}
              severidad={severidad}
              setSeveridad={setSeveridad}
              descripcion={descripcion}
              setDescripcion={setDescripcion}
              files={files}
              setFiles={setFiles}
            />
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="flex gap-2 border-t border-gray-100 px-4 py-3 pb-safe dark:border-gray-800">
            {stepIdx > 0 && (
              <button
                type="button"
                onClick={back}
                className="btn btn-outline px-5"
              >
                {t("back")}
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={submit}
                disabled={!canProceed || submitting}
                className="btn btn-primary flex-1"
              >
                {submitting
                  ? t("sending")
                  : isReport
                    ? t("submitReport")
                    : t("submitAlert")}
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                disabled={!canProceed}
                className="btn btn-primary flex-1"
              >
                {t("next")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ── Steps ──────────────────────────────────────────────────────────── */

function PatenteStep({
  patente,
  setPatente,
  patenteOk,
}: {
  patente: string;
  setPatente: (v: string) => void;
  patenteOk: boolean;
}) {
  const t = useTranslations("wizard");
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold">{t("patenteTitle")}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("patenteSubtitle")}
        </p>
      </div>
      <div>
        <input
          value={patente}
          onChange={(e) => setPatente(e.target.value.toUpperCase())}
          placeholder={t("patentePlaceholder")}
          autoCapitalize="characters"
          autoFocus
          className={`w-full rounded-lg border px-3 py-3 text-center font-mono text-2xl tracking-widest outline-none ${
            patente && !patenteOk
              ? "border-red-400"
              : patenteOk
                ? "border-green-500"
                : "border-gray-300 dark:border-gray-700"
          }`}
        />
        {patente && !patenteOk && (
          <p className="mt-1 text-xs text-red-500">{t("patenteInvalid")}</p>
        )}
        {patenteOk && (
          <p className="mt-1 text-center text-xs text-green-600">
            {formatPatente(patente)} ✓
          </p>
        )}
      </div>

      {/* Future: detect the plate from a photo. */}
      <button
        type="button"
        disabled
        title={t("soonTitle")}
        className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500"
      >
        <Camera className="h-4 w-4" aria-hidden />
        {t("detectPhoto")}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase dark:bg-gray-800">
          {t("soon")}
        </span>
      </button>
    </div>
  );
}

function CuandoStep({
  date,
  hour,
  minute,
  setDate,
  setHour,
  setMinute,
  onQuick,
}: {
  date: string;
  hour: number;
  minute: number;
  setDate: (v: string) => void;
  setHour: (v: number) => void;
  setMinute: (v: number) => void;
  onQuick: (minutesAgo: number) => void;
}) {
  const t = useTranslations("wizard");
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold">{t("cuandoTitle")}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("cuandoSubtitle")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: t("quickNow"), m: 0 },
          { label: t("quick30"), m: 30 },
          { label: t("quick60"), m: 60 },
          { label: t("quick120"), m: 120 },
        ].map((q) => {
          const d = new Date(Date.now() - q.m * 60000);
          const qDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
          const active =
            date === qDate &&
            hour === d.getHours() &&
            minute === Math.floor(d.getMinutes() / 5) * 5;
          return (
            <button
              key={q.label}
              type="button"
              onClick={() => onQuick(q.m)}
              className={`pressable rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-gray-300 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 dark:active:bg-gray-700"
              }`}
            >
              {q.label}
            </button>
          );
        })}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("dateLabel")}
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("hourLabel")}{" "}
          <span className="text-gray-400 dark:text-gray-500">
            {t("hour24")}
          </span>
        </label>
        <div className="flex items-center gap-2">
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-center text-lg outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {pad(h)}
              </option>
            ))}
          </select>
          <span className="text-lg font-bold text-gray-400 dark:text-gray-500">
            :
          </span>
          <select
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value))}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-center text-lg outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {pad(m)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function DondeStep({
  pos,
  direccion,
  onChange,
}: {
  pos: LatLng | null;
  direccion: string | null;
  onChange: (v: LatLng, dir: string | null) => void;
}) {
  const t = useTranslations("wizard");
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold">{t("dondeTitle")}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t.rich("dondeSubtitle", {
            b: (chunks) => <span className="font-medium">{chunks}</span>,
          })}
        </p>
      </div>

      <MapField value={pos} onChange={onChange} />

      {direccion ? (
        <p className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-950/50 dark:text-green-300">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {direccion}
        </p>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t("dondeRequired")}
        </p>
      )}
    </div>
  );
}

function DetallesStep({
  isReport,
  catalog,
  tipo,
  setTipo,
  severidad,
  setSeveridad,
  descripcion,
  setDescripcion,
  files,
  setFiles,
}: {
  isReport: boolean;
  catalog: CatalogItem<string>[];
  tipo: string;
  setTipo: (v: string) => void;
  severidad: number;
  setSeveridad: (v: number) => void;
  descripcion: string;
  setDescripcion: (v: string) => void;
  files: File[];
  setFiles: (v: File[]) => void;
}) {
  const t = useTranslations("wizard");
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold">{t("detallesTitle")}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("detallesSubtitle")}
        </p>
      </div>

      {/* Tipo (requerido) */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          {isReport ? t("typeReport") : t("typeAlert")}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {catalog.map((c) => {
            const Icon = c.icon;
            const selected = tipo === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setTipo(c.value)}
                className={`pressable flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  selected
                    ? "border-brand-500 bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:active:bg-gray-700"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${selected ? "text-brand-600 dark:text-brand-300" : "text-gray-500 dark:text-gray-400"}`}
                  aria-hidden
                />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Severidad (solo report) */}
      {isReport && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("severity")}{" "}
            <span className="text-gray-400 dark:text-gray-500">
              {t("optional")}
            </span>
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSeveridad(severidad === n ? 0 : n)}
                className={`pressable flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${
                  severidad >= n && severidad > 0
                    ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:active:bg-gray-700"
                }`}
                title={SEVERIDAD_LABELS[n]}
              >
                {n}
              </button>
            ))}
          </div>
          {severidad > 0 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {SEVERIDAD_LABELS[severidad]}
            </p>
          )}
        </div>
      )}

      {/* Descripción */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("description")}{" "}
          <span className="text-gray-400 dark:text-gray-500">
            {t("optional")}
          </span>
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          placeholder={t("descriptionPlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
        />
      </div>

      {/* Fotos */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("photos")}{" "}
          <span className="text-gray-400 dark:text-gray-500">
            {t("optional")}
          </span>
        </label>
        <PhotoPicker files={files} setFiles={setFiles} />
      </div>
    </div>
  );
}

const MAX_PHOTOS = 5;

function PhotoPicker({
  files,
  setFiles,
}: {
  files: File[];
  setFiles: (v: File[]) => void;
}) {
  const t = useTranslations("wizard");
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const next = files.map((f) => URL.createObjectURL(f));
    setUrls(next);
    return () => {
      next.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    setFiles([...files, ...incoming].slice(0, MAX_PHOTOS));
  };

  const removeAt = (i: number) => {
    setFiles(files.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {files.map((file, i) => (
          <div
            key={`${file.name}-${i}`}
            className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urls[i]}
              alt={t("photoAlt", { n: i + 1 })}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={t("photoRemove")}
              className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ))}

        {files.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label={t("photoAdd")}
            className="pressable grid h-20 w-20 place-items-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-600 dark:text-gray-500 dark:hover:border-brand-500 dark:hover:text-brand-300"
          >
            <Plus className="h-6 w-6" aria-hidden />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />

      {files.length > 0 && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t("photoCount", { count: files.length, max: MAX_PHOTOS })}
        </p>
      )}
    </div>
  );
}

function ResultView({
  result,
  isReport,
  onRetry,
  onClose,
  onHome,
}: {
  result:
    | { kind: "ok"; notified: boolean; registered: boolean }
    | { kind: "queued" }
    | { kind: "error"; msg: string };
  isReport: boolean;
  onRetry: () => void;
  onClose: () => void;
  onHome: () => void;
}) {
  const t = useTranslations("wizard");
  const tc = useTranslations("common");
  if (result.kind === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/50">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
          <TriangleAlert className="h-7 w-7" aria-hidden />
        </div>
        <h2 className="text-lg font-bold">{t("resultErrorTitle")}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {result.msg}
        </p>
        <button onClick={onRetry} className="btn btn-primary mt-5 w-full">
          {t("resultRetry")}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300">
        {result.kind === "queued" ? (
          <Download className="h-7 w-7" aria-hidden />
        ) : (
          <CircleCheck className="h-7 w-7" aria-hidden />
        )}
      </div>
      <h2 className="text-lg font-bold">
        {result.kind === "queued"
          ? t("resultQueuedTitle")
          : isReport
            ? t("resultReportSent")
            : t("resultAlertSent")}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {result.kind === "queued"
          ? t("resultQueuedBody")
          : result.notified
            ? t("resultNotifiedBody")
            : result.registered
              ? t("resultRegisteredBody")
              : t("resultNoOwnerBody")}
      </p>
      <div className="mt-5 flex gap-2">
        <button onClick={onClose} className="btn btn-outline flex-1">
          {tc("cerrar")}
        </button>
        <button onClick={onHome} className="btn btn-primary flex-1">
          {t("resultHome")}
        </button>
      </div>
    </div>
  );
}
