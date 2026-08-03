"use client";

import { useState } from "react";
import { FileText, Siren } from "lucide-react";
import IncidentWizard from "@/components/IncidentWizard";

type Mode = "report" | "alert";

export default function QuickActions() {
  const [open, setOpen] = useState<Mode | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 p-4">
        <button
          type="button"
          onClick={() => setOpen("report")}
          className="card-interactive flex flex-col gap-3 p-4 text-left"
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <FileText className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-semibold leading-tight">
              Reportar incidente
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Conducta de un vehículo
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpen("alert")}
          className="card-interactive flex flex-col gap-3 p-4 text-left"
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400">
            <Siren className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-semibold leading-tight">Avisar en vivo</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Problema en un ajeno
            </span>
          </span>
        </button>
      </div>

      <IncidentWizard
        mode="report"
        open={open === "report"}
        onClose={() => setOpen(null)}
      />
      <IncidentWizard
        mode="alert"
        open={open === "alert"}
        onClose={() => setOpen(null)}
      />
    </>
  );
}
