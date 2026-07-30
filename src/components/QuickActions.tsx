"use client";

import { useState } from "react";
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
          className="flex flex-col gap-1 rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-100"
        >
          <span className="text-2xl">📝</span>
          <span className="font-semibold">Reportar incidente</span>
          <span className="text-xs text-gray-500">Conducta de un vehículo</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen("alert")}
          className="flex flex-col gap-1 rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-100"
        >
          <span className="text-2xl">🚨</span>
          <span className="font-semibold">Avisar en vivo</span>
          <span className="text-xs text-gray-500">Problema en un ajeno</span>
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
