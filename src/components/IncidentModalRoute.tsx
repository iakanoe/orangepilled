"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IncidentWizard from "@/components/IncidentWizard";
import { nativeNavigate } from "@/components/NativeTransitions";

// Thin wrapper so the manifest shortcuts and deep links (/reportar, /avisar)
// still work: they open the wizard as a modal over a blank shell and return
// home when it's dismissed.
export default function IncidentModalRoute({
  mode,
  initialPatente = "",
}: {
  mode: "report" | "alert";
  initialPatente?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <IncidentWizard
      mode={mode}
      open={open}
      initialPatente={initialPatente}
      onClose={() => {
        setOpen(false);
        // `replace` drops /reportar|/avisar from history so back (or the swipe
        // gesture) doesn't reopen this modal.
        nativeNavigate("back", () => router.replace("/"));
      }}
    />
  );
}
