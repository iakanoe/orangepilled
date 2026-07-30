import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOwner } from "@/lib/notify";
import { parsePatente, formatPatente } from "@/lib/patente";
import { uploadDataUrls } from "@/lib/upload-server";
import {
  isIncidentTipo,
  incidentLabel,
  incidentEmoji,
} from "@/lib/incident-types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad json" }, { status: 400 });

  const { ok, normalized } = parsePatente(body.patente ?? "");
  if (!ok)
    return NextResponse.json({ error: "patente inválida" }, { status: 400 });
  if (!isIncidentTipo(body.tipo)) {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  }

  const lat = typeof body.lat === "number" ? body.lat : null;
  const lng = typeof body.lng === "number" ? body.lng : null;
  if (lat === null || lng === null) {
    return NextResponse.json({ error: "ubicación requerida" }, { status: 400 });
  }
  let fotos: string[] = Array.isArray(body.fotos) ? body.fotos.slice(0, 5) : [];

  const admin = createAdminClient();

  // Photos captured offline ride along as data URLs; upload them now (this
  // often runs when the queued request is replayed after reconnecting).
  if (Array.isArray(body.fotosPendientes) && body.fotosPendientes.length) {
    const uploaded = await uploadDataUrls(
      admin,
      "reports",
      body.fotosPendientes.slice(0, 5),
    );
    fotos = [...fotos, ...uploaded].slice(0, 5);
  }

  const { data: report, error } = await admin
    .from("reports")
    .insert({
      patente: normalized,
      reporter_id: user.id,
      tipo: body.tipo,
      descripcion: body.descripcion ?? null,
      severidad: typeof body.severidad === "number" ? body.severidad : null,
      lat,
      lng,
      direccion: body.direccion ?? null,
      ocurrido_en: body.ocurrido_en ?? new Date().toISOString(),
      client_id: typeof body.clientId === "string" ? body.clientId : null,
    })
    .select("id")
    .single();

  if (error || !report) {
    // Idempotent replay: this exact submission (same clientId) already landed.
    // Ack it without re-inserting media or re-notifying.
    if (error?.code === "23505") {
      return NextResponse.json({ duplicate: true });
    }
    return NextResponse.json(
      { error: error?.message ?? "no se pudo crear" },
      { status: 500 },
    );
  }

  if (fotos.length) {
    await admin
      .from("media")
      .insert(
        fotos.map((url) => ({ report_id: report.id, url, tipo: "image" })),
      );
  }

  // Everyone tracking this plate. "Registered" means the plate exists in the
  // app at all — independent of who ends up being notified.
  const { data: trackers } = await admin
    .from("vehicles")
    .select("owner_id")
    .eq("patente", normalized);
  const allOwnerIds = [
    ...new Set((trackers ?? []).map((t) => t.owner_id as string)),
  ];
  // Notify every tracker of the plate, including the reporter when they
  // track it themselves (so reports on your own vehicles reach your Avisos).
  const ownerIds = allOwnerIds;

  await Promise.all(
    ownerIds.map((ownerId) =>
      notifyOwner(admin, {
        ownerId,
        origen: "report",
        origenId: report.id,
        title: `${incidentEmoji(body.tipo)} Reporte sobre ${formatPatente(normalized)}`,
        body:
          incidentLabel(body.tipo) +
          (body.descripcion ? ` — ${body.descripcion}` : ""),
        image: fotos[0] ?? null,
      }),
    ),
  );

  return NextResponse.json({
    id: report.id,
    vehicleRegistered: allOwnerIds.length > 0,
    ownersNotified: ownerIds.length,
  });
}
