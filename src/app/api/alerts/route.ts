import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOwner } from "@/lib/notify";
import { parsePatente, formatPatente } from "@/lib/patente";
import { uploadDataUrls } from "@/lib/upload-server";
import { isAlertTipo, alertLabel } from "@/lib/incident-types";

// Live alert: someone flags a problem on someone else's vehicle
// (alarm, flat tyre, blocking exit...). If the plate is registered, the
// owner gets an immediate push.
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
  if (!isAlertTipo(body.tipo)) {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  }

  const lat = typeof body.lat === "number" ? body.lat : null;
  const lng = typeof body.lng === "number" ? body.lng : null;
  let fotos: string[] = Array.isArray(body.fotos) ? body.fotos.slice(0, 5) : [];

  const admin = createAdminClient();

  // Photos captured offline ride along as data URLs; upload them now (this
  // often runs when the queued request is replayed after reconnecting).
  if (Array.isArray(body.fotosPendientes) && body.fotosPendientes.length) {
    const uploaded = await uploadDataUrls(
      admin,
      "alerts",
      body.fotosPendientes.slice(0, 5),
    );
    fotos = [...fotos, ...uploaded].slice(0, 5);
  }

  const { data: alert, error } = await admin
    .from("live_alerts")
    .insert({
      patente: normalized,
      reporter_id: user.id,
      tipo: body.tipo,
      descripcion: body.descripcion ?? null,
      lat,
      lng,
      direccion: body.direccion ?? null,
      client_id: typeof body.clientId === "string" ? body.clientId : null,
    })
    .select("id")
    .single();

  if (error || !alert) {
    // Idempotent replay: this exact submission (same clientId) already landed.
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
      .insert(fotos.map((url) => ({ alert_id: alert.id, url, tipo: "image" })));
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
  // track it themselves (so alerts on your own vehicles reach your Avisos).
  const ownerIds = allOwnerIds;

  await Promise.all(
    ownerIds.map((ownerId) =>
      notifyOwner(admin, {
        ownerId,
        origen: "alert",
        origenId: alert.id,
        title: `Aviso sobre ${formatPatente(normalized)}`,
        body:
          alertLabel(body.tipo) +
          (body.descripcion ? ` — ${body.descripcion}` : ""),
        image: fotos[0] ?? null,
      }),
    ),
  );

  return NextResponse.json({
    id: alert.id,
    vehicleRegistered: allOwnerIds.length > 0,
    ownersNotified: ownerIds.length,
  });
}
