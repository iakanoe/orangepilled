-- =====================================================================
-- Alerta Patente — Supabase schema (MVP)
-- Run this in the Supabase SQL Editor (or `supabase db push`).
-- Idempotent where practical: safe to re-run.
-- =====================================================================

-- PostGIS lives in the `extensions` schema on Supabase.
create extension if not exists postgis with schema extensions;

-- Resolve unqualified geography / ST_* against extensions during DDL.
set search_path to public, extensions;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type vehicle_tipo as enum ('particular', 'flota');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_rol as enum ('dueno', 'admin_flota', 'admin_sistema');
exception when duplicate_object then null; end $$;

do $$ begin
  create type incident_tipo as enum (
    'conduccion_imprudente',
    'conduccion_agresiva',
    'no_respetar_semaforos',
    'chocar_a_otros',
    'conducir_por_ciclovia',
    'estacionar_mal',
    'exceso_velocidad',
    'uso_celular',
    'invadir_carril',
    'otro'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_tipo as enum (
    'alarma_sonando',
    'rueda_pinchada',
    'luces_encendidas',
    'bloqueando_salida',
    'ventana_abierta',
    'otro'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_estado as enum ('activo', 'resuelto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notif_origen as enum ('report', 'alert');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- profiles  (maps to spec "users"; auth email lives in auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  rol         user_rol not null default 'dueno',
  created_at  timestamptz not null default now()
);
-- Older deployments had a free-text display name; it's no longer used.
alter table public.profiles drop column if exists nombre;

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- vehicles  (a per-user association to a plate: patente + personal alias)
-- A plate is NOT owned globally: any number of users may add the same
-- patente to their account, each with their own alias. Removing a vehicle
-- only drops that user's association — it never deletes reports/alerts,
-- which are keyed by patente and shared across everyone.
-- ---------------------------------------------------------------------
create table if not exists public.vehicles (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  patente     text not null,                 -- normalized (uppercase, no spaces)
  alias       text,
  created_at  timestamptz not null default now(),
  unique (owner_id, patente)                 -- one association per user+plate
);
create index if not exists vehicles_owner_idx   on public.vehicles (owner_id);
create index if not exists vehicles_patente_idx on public.vehicles (patente);

-- Migrate existing installs: strip per-vehicle metadata (now the plate is a
-- shared entity, not a described car) and switch the plate uniqueness from
-- global to per-user so several users can track the same patente.
alter table public.vehicles drop column if exists marca;
alter table public.vehicles drop column if exists modelo;
alter table public.vehicles drop column if exists color;
alter table public.vehicles drop column if exists anio;
alter table public.vehicles drop column if exists foto_url;
alter table public.vehicles drop column if exists tipo;
alter table public.vehicles drop column if exists verificado;
alter table public.vehicles drop constraint if exists vehicles_patente_key;
do $$ begin
  alter table public.vehicles add constraint vehicles_owner_id_patente_key unique (owner_id, patente);
exception when duplicate_table or duplicate_object then null; end $$;
create index if not exists vehicles_patente_idx on public.vehicles (patente);

-- ---------------------------------------------------------------------
-- reports  (incidentes de conducta)
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  patente     text not null,                 -- normalized; the stable target key
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  tipo        incident_tipo not null,
  descripcion text,
  severidad   smallint check (severidad between 1 and 5),
  lat         double precision,
  lng         double precision,
  direccion   text,
  -- Auto-derived point for spatial queries / heatmap. Null when no location.
  geog        geography(Point, 4326) generated always as (
    case when lat is not null and lng is not null
      then extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::geography
    end
  ) stored,
  ocurrido_en timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
-- Reports are keyed by patente, never by a per-user vehicle row. Drop the
-- old RLS policy first: it references vehicle_id, so the column can't go
-- until it does. It's recreated (patente-based) in the RLS section below.
drop policy if exists reports_select_visible on public.reports;
alter table public.reports drop column if exists vehicle_id;
create index if not exists reports_patente_idx  on public.reports (patente);
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists reports_geog_idx      on public.reports using gist (geog);
create index if not exists reports_ocurrido_idx  on public.reports (ocurrido_en desc);

-- ---------------------------------------------------------------------
-- live_alerts  (avisos en vivo sobre vehiculo ajeno)
-- ---------------------------------------------------------------------
create table if not exists public.live_alerts (
  id          uuid primary key default gen_random_uuid(),
  patente     text not null,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  tipo        alert_tipo not null,
  descripcion text,
  lat         double precision,
  lng         double precision,
  direccion   text,
  geog        geography(Point, 4326) generated always as (
    case when lat is not null and lng is not null
      then extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::geography
    end
  ) stored,
  estado      alert_estado not null default 'activo',
  created_at  timestamptz not null default now()
);
-- Same as reports: drop policies referencing vehicle_id before the column.
drop policy if exists alerts_select_visible on public.live_alerts;
drop policy if exists alerts_update_owner on public.live_alerts;
alter table public.live_alerts drop column if exists vehicle_id;
create index if not exists alerts_patente_idx on public.live_alerts (patente);
create index if not exists alerts_geog_idx     on public.live_alerts using gist (geog);

-- ---------------------------------------------------------------------
-- media  (fotos de reportes / avisos)
-- ---------------------------------------------------------------------
create table if not exists public.media (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid references public.reports (id) on delete cascade,
  alert_id   uuid references public.live_alerts (id) on delete cascade,
  url        text not null,
  tipo       text not null default 'image',
  created_at timestamptz not null default now(),
  -- exactly one parent
  check ((report_id is not null)::int + (alert_id is not null)::int = 1)
);
create index if not exists media_report_idx on public.media (report_id);
create index if not exists media_alert_idx  on public.media (alert_id);

-- ---------------------------------------------------------------------
-- notifications  (centro de notificaciones in-app)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  origen     notif_origen not null,
  origen_id  uuid not null,
  leido      boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, leido, created_at desc);

-- ---------------------------------------------------------------------
-- push_subscriptions  (Web Push endpoints por usuario)
-- ---------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_user_idx on public.push_subscriptions (user_id);

-- =====================================================================
-- Row Level Security
-- Writes to reports / live_alerts / notifications / media happen through
-- API route handlers using the SERVICE ROLE key (bypasses RLS), because
-- they must read across owners (patente -> vehicle owner) and fan out
-- notifications. Clients only ever READ their own slice via these
-- policies, and manage their own vehicles + push subscription directly.
-- =====================================================================

alter table public.profiles           enable row level security;
alter table public.vehicles           enable row level security;
alter table public.reports            enable row level security;
alter table public.live_alerts        enable row level security;
alter table public.media              enable row level security;
alter table public.notifications      enable row level security;
alter table public.push_subscriptions enable row level security;

-- profiles: own row only
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
drop policy if exists profiles_upsert_own on public.profiles;
create policy profiles_upsert_own on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

-- vehicles: full CRUD on own vehicles only
drop policy if exists vehicles_all_own on public.vehicles;
create policy vehicles_all_own on public.vehicles
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- reports: visible if you made it OR it targets a patente you track
drop policy if exists reports_select_visible on public.reports;
create policy reports_select_visible on public.reports
  for select using (
    reporter_id = auth.uid()
    or patente in (select patente from public.vehicles where owner_id = auth.uid())
  );
-- reporter may delete their own report (basic self-moderation)
drop policy if exists reports_delete_own on public.reports;
create policy reports_delete_own on public.reports
  for delete using (reporter_id = auth.uid());

-- live_alerts: same visibility model
drop policy if exists alerts_select_visible on public.live_alerts;
create policy alerts_select_visible on public.live_alerts
  for select using (
    reporter_id = auth.uid()
    or patente in (select patente from public.vehicles where owner_id = auth.uid())
  );
-- a user tracking the plate can mark an alert resolved
drop policy if exists alerts_update_owner on public.live_alerts;
create policy alerts_update_owner on public.live_alerts
  for update using (
    patente in (select patente from public.vehicles where owner_id = auth.uid())
  );

-- media: visible if the parent report/alert is visible to you
drop policy if exists media_select_visible on public.media;
create policy media_select_visible on public.media
  for select using (
    report_id in (select id from public.reports)     -- reports RLS already filters
    or alert_id in (select id from public.live_alerts)
  );

-- notifications: own only
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid());
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid());

-- push_subscriptions: own only (client upserts/reads/deletes its endpoint)
drop policy if exists push_all_own on public.push_subscriptions;
create policy push_all_own on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
-- Heatmap source (anonymized): only coarse location + type + time.
-- No patente, no ids, no reporter. Later phase can bucket via H3/hexbin.
-- =====================================================================
create or replace view public.reports_heatmap
with (security_invoker = off) as
  select
    round(lat::numeric, 4) as lat,   -- ~11 m precision, drops fine detail
    round(lng::numeric, 4) as lng,
    tipo,
    ocurrido_en
  from public.reports
  where lat is not null and lng is not null;

grant select on public.reports_heatmap to anon, authenticated;

-- =====================================================================
-- Storage: public "media" bucket for report/vehicle photos.
-- If you change NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET, change 'media' here.
-- Public-read (served via CDN); only signed-in users may upload.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Public read of objects in the media bucket.
drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects
  for select using (bucket_id = 'media');

-- Authenticated users can upload to the media bucket.
drop policy if exists media_authenticated_insert on storage.objects;
create policy media_authenticated_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media');

-- =====================================================================
-- Auto-deactivate live alerts one hour after they were raised.
-- Mirrors the app-level active window (ALERT_ACTIVE_WINDOW_MS in
-- src/lib/alerts.ts = 1 hour): any 'activo' alert older than that flips
-- to 'resuelto' in the DB, without needing the owner to dismiss it.
-- =====================================================================
create or replace function public.deactivate_stale_alerts()
returns void
language sql
security definer
set search_path = public
as $$
  update public.live_alerts
     set estado = 'resuelto'
   where estado = 'activo'
     and created_at < now() - interval '1 hour';
$$;

-- Schedule the cleanup every minute via pg_cron.
create extension if not exists pg_cron;

-- Idempotent (re)schedule: drop an existing job with the same name first.
do $$
begin
  perform cron.unschedule('deactivate-stale-alerts');
exception when others then null;
end $$;

select cron.schedule(
  'deactivate-stale-alerts',
  '* * * * *',
  $$ select public.deactivate_stale_alerts(); $$
);

-- =====================================================================
-- Realtime: stream live_alerts INSERTs to the browser so the "Alertas
-- urgentes" section on the dashboard appears on its own, without a manual
-- refresh. RLS (alerts_select_visible) still gates what each user receives.
-- The notifications table is streamed too, so the in-app notification
-- center updates live (RLS notifications_select_own gates delivery).
-- Idempotent: adding a table already in the publication raises, so guard it.
-- =====================================================================
do $$
begin
  alter publication supabase_realtime add table public.live_alerts;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

