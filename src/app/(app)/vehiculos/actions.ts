"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parsePatente } from "@/lib/patente";

export type VehicleActionResult =
  { ok: true; patente: string } | { ok: false; error: string };

// Invalidates every view that lists or scores vehicles so the client Router
// Cache serves fresh data on the next navigation (not just after a full
// reload). Server-side reads are RLS-scoped to the signed-in owner.
function revalidateVehicleViews(patente?: string) {
  revalidatePath("/vehiculos");
  revalidatePath("/");
  if (patente) revalidatePath(`/vehiculos/${patente}`);
}

export async function saveVehicle(input: {
  id?: string;
  patente: string;
  alias: string | null;
}): Promise<VehicleActionResult> {
  const parsed = parsePatente(input.patente);
  if (!parsed.ok) return { ok: false, error: "Patente inválida" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada. Volvé a entrar." };

  const row = {
    owner_id: user.id,
    patente: parsed.normalized,
    alias: input.alias || null,
  };

  const { error } = input.id
    ? await supabase.from("vehicles").update(row).eq("id", input.id)
    : await supabase.from("vehicles").insert(row);

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "Ya agregaste esta patente a tu cuenta."
          : error.message,
    };
  }

  revalidateVehicleViews(parsed.normalized);
  return { ok: true, patente: parsed.normalized };
}

export async function deleteVehicle(id: string): Promise<VehicleActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada. Volvé a entrar." };

  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateVehicleViews();
  return { ok: true, patente: "" };
}
