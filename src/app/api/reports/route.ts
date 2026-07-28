import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOwner } from "@/lib/notify";
import { parsePatente, formatPatente } from "@/lib/patente";
import { isIncidentTipo, incidentLabel, incidentEmoji } from "@/lib/incident-types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad json" }, { status: 400 });

  const { ok, normalized } = parsePatente(body.patente ?? "");
  if (!ok) return NextResponse.json({ error: "patente inválida" }, { status: 400 });
  if (!isIncidentTipo(body.tipo)) {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  }

  const lat = typeof body.lat === "number" ? body.lat : null;
  const lng = typeof body.lng === "number" ? body.lng : null;
  const fotos: string[] = Array.isArray(body.fotos) ? body.fotos.slice(0, 5) : [];

  const admin = createAdminClient();

  // Link to a registered vehicle by patente (may be null).
  const { data: vehicle } = await admin
    .from("vehicles")
    .select("id, owner_id")
    .eq("patente", normalized)
    .maybeSingle();

  const { data: report, error } = await admin
    .from("reports")
    .insert({
      patente: normalized,
      vehicle_id: vehicle?.id ?? null,
      reporter_id: user.id,
      tipo: body.tipo,
      descripcion: body.descripcion ?? null,
      severidad:
        typeof body.severidad === "number" ? body.severidad : null,
      lat,
      lng,
      direccion: body.direccion ?? null,
      ocurrido_en: body.ocurrido_en ?? new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !report) {
    return NextResponse.json(
      { error: error?.message ?? "no se pudo crear" },
      { status: 500 },
    );
  }

  if (fotos.length) {
    await admin
      .from("media")
      .insert(fotos.map((url) => ({ report_id: report.id, url, tipo: "image" })));
  }

  // Notify the owner (unless the reporter is the owner).
  if (vehicle && vehicle.owner_id !== user.id) {
    await notifyOwner(admin, {
      ownerId: vehicle.owner_id,
      origen: "report",
      origenId: report.id,
      title: `${incidentEmoji(body.tipo)} Reporte sobre ${formatPatente(normalized)}`,
      body: incidentLabel(body.tipo) + (body.descripcion ? ` — ${body.descripcion}` : ""),
      image: fotos[0] ?? null,
    });
  }

  return NextResponse.json({
    id: report.id,
    vehicleRegistered: !!vehicle,
    ownerNotified: !!vehicle && vehicle.owner_id !== user.id,
  });
}
