"use client";

// In-app confirmation modal (no browser confirm()), so the flow works
// identically once the app is ported to React Native. Fully controlled:
// the parent owns `open` and the confirm/cancel handlers.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-pop dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className={`text-lg font-bold ${
            danger ? "text-red-600 dark:text-red-400" : ""
          }`}
        >
          {title}
        </h2>
        {message && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {message}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`btn w-full text-white ${
              danger
                ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                : "btn-primary"
            }`}
          >
            {busy ? "…" : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn btn-outline w-full"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
