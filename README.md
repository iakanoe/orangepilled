# Alerta Patente

PWA instalable para **registrar, reportar y visualizar el comportamiento vial
de vehículos** por patente. Cualquiera puede reportar un incidente sobre una
patente; si esa patente está registrada por su dueño, el dueño recibe una
**notificación push al instante**. También permite **avisar en vivo** de un
problema en un vehículo ajeno (alarma sonando, rueda pinchada, etc.).

> **Estado:** MVP (fase 1). Incluye registro de vehículos, reporte con mapa
> OSM, push al dueño, avisos en vivo, dashboard con filtros y PWA instalable
> con cola offline. Diferido a fases siguientes: heatmap agregado, verificación
> fuerte de titularidad y detección de patente por foto (ALPR).

## Stack

- **Next.js 15** (App Router) — UI + API en un solo proyecto (Route Handlers).
- **Supabase** — Postgres + **PostGIS**, Auth (email OTP), Storage (fotos). Todo
  en free tier.
- **Serwist** — service worker, precache del app shell, offline y **Background
  Sync** (cola de reportes offline).
- **Web Push (VAPID)** con la librería `web-push`.
- **Leaflet + OSM + Nominatim** — mapa de ubicación, pin arrastrable, geocoding.
- **TailwindCSS**, **Recharts** (gráficos del dashboard).

## Puesta en marcha

### 1. Dependencias

```bash
npm install
```

### 2. Proyecto Supabase

1. Creá un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pegá y ejecutá [`supabase/schema.sql`](supabase/schema.sql).
   Crea las tablas, PostGIS, las políticas RLS, el trigger que arma el perfil al
   registrarse, la vista anonimizada para el heatmap y el bucket de Storage.
3. En **Project Settings → API Keys** copiá `URL`, la `publishable key`
   (`sb_publishable_…`) y la `secret key` (`sb_secret_…`).
4. En **Authentication → Providers → Email**, dejá habilitado el login por email
   (OTP). Para desarrollo podés desactivar "Confirm email" si querés.

### 3. Claves VAPID (push)

```bash
npm run gen:vapid
```

Copiá las tres líneas que imprime a tu `.env.local`.

### 4. Variables de entorno

```bash
cp .env.example .env.local
```

Completá con los valores de Supabase y VAPID. Ver [`.env.example`](.env.example)
para la lista completa.

### 5. Iconos de la PWA

```bash
npm run gen:icons
```

Genera todos los tamaños (incluidos maskable) a partir de
[`scripts/icon.svg`](scripts/icon.svg) en `public/icons/`. Editá el SVG para
cambiar el ícono.

### 6. Correr

```bash
npm run dev      # desarrollo (service worker desactivado)
npm run build && npm start   # producción (PWA + push activos)
```

> El service worker y el push **solo funcionan en el build de producción** (o
> desplegado con HTTPS). En `next dev` están desactivados a propósito para
> evitar problemas de caché.

## Deploy en Vercel

La integración de **Supabase** carga sola sus variables
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`) al conectar el proyecto. Lo único manual es **VAPID**
(las claves de push) y un par de variables de la app.

### 1. Claves VAPID → Vercel (automático)

El script `gen:vapid` acepta tu email para el `subject` y puede subir las tres
variables directamente a Vercel:

```bash
npm i -g vercel        # si aún no la tenés
vercel link            # linkeá este repo a tu proyecto de Vercel

# genera las claves con tu email y las carga en production/preview/development
npm run gen:vapid -- tu@email.com --vercel
```

Alternativas del mismo script:

```bash
npm run gen:vapid -- tu@email.com            # solo imprime las 3 líneas
npm run gen:vapid -- tu@email.com --write    # las escribe/actualiza en .env.local
```

> `--vercel` requiere la Vercel CLI y el proyecto linkeado. Corre
> `vercel env rm/add` por cada variable, así que es **idempotente**: podés
> re-ejecutarlo para rotar las claves.

### 2. Variables restantes de la app

En **Vercel → Project → Settings → Environment Variables** agregá:

| Variable                              | Valor                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | `media` (o el bucket que creaste)                                            |
| `NEXT_PUBLIC_APP_NAME`                | `Alerta Patente`                                                             |
| `NEXT_PUBLIC_APP_URL`                 | la URL pública del deploy (ej. `https://tu-app.vercel.app`, sin barra final) |

> `NEXT_PUBLIC_APP_URL` se usa para armar los links de las notificaciones push.
> Ponelo con el dominio final de producción.

### 3. Base de datos (manual, una sola vez)

El esquema **no se despliega solo**: la integración de Supabase con Vercel solo
inyecta las credenciales, no crea las tablas. Hay que aplicarlo una vez.

**Método recomendado (free tier): SQL Editor.** Es la vía más simple y 100%
gratuita — no necesita la Supabase CLI ni la contraseña de la base:

1. Entrá a tu proyecto en [supabase.com](https://supabase.com) → **SQL Editor**.
2. Abrí [`supabase/schema.sql`](supabase/schema.sql), copiá **todo** el contenido
   y pegalo en un query nuevo.
3. **Run**. Crea tablas, PostGIS, políticas RLS, triggers, la vista del heatmap
   y el bucket de Storage.

Solo repetís este paso si cambia el esquema. Es idempotente en la mayor parte,
pero revisá antes de re-correrlo sobre datos reales.

### 4. Deploy

```bash
vercel --prod    # o pusheá a la rama conectada y Vercel buildea solo
```

Tras cargar/rotar variables, hacé un **redeploy** para que tomen efecto.

## Arquitectura (mapa rápido)

```
src/
  app/
    (app)/                # rutas autenticadas (bottom nav)
      page.tsx            # dashboard + acciones rápidas
      vehiculos/          # ABM de vehículos
      reportar/           # reporte de incidente
      avisar/             # aviso en vivo
      notificaciones/     # centro de notificaciones
      configuracion/      # configuración + push + logout
    api/
      reports/route.ts    # crea reporte + vincula patente + notifica + push
      alerts/route.ts     # crea aviso en vivo + notifica + push
      push/subscribe/     # guarda/borra suscripción push del dispositivo
    auth/signout/         # cierre de sesión
    login/                # login por OTP (se queda dentro de la PWA)
    sw.ts                 # service worker (push, offline, background sync)
    manifest.ts           # Web App Manifest
  components/             # UI (MapPicker, Dashboard, formularios, etc.)
  lib/
    supabase/             # clients: browser, server, admin (service role), middleware
    patente.ts            # validación/normalización de patentes AR
    incident-types.ts     # catálogos (deben coincidir con los enums SQL)
    push.ts / notify.ts   # envío de push + fan-out de notificaciones (server)
middleware.ts             # refresh de sesión + gate de rutas privadas
supabase/schema.sql       # esquema completo + RLS + Storage
```

### Decisiones clave

- **La patente es el identificador universal.** Los reportes se guardan siempre
  con la patente normalizada; si existe un `vehicle` con esa patente, se vincula
  y se notifica al dueño.
- **Escrituras sensibles pasan por Route Handlers con el service role.** Un
  reportante no puede leer los vehículos de otros (RLS), así que el vínculo
  patente→dueño y la creación de notificaciones se hacen server-side. Los
  clientes solo **leen su propia porción** vía políticas RLS, y gestionan sus
  vehículos y su suscripción push directamente.
- **Offline-first para reportes.** El SW encola los `POST` a `/api/reports` y
  `/api/alerts` cuando no hay conexión (Background Sync) y los reenvía al
  reconectar. En iOS (sin Background Sync) el cliente dispara el reenvío al
  volver la conexión o al reabrir la app. Las fotos también se guardan offline:
  se comprimen y viajan dentro del request, y el server las sube al Storage al
  procesarlo. Cada envío lleva un `clientId` (UUID) e insert idempotente, así un
  reintento nunca duplica el reporte y no se pierde ante un 401/5xx.
- **Login requerido para reportar** (decisión de MVP): mejor anti-abuso y base
  para reputación. Cambiar a anónimo implicaría hacer `reporter_id` nullable y
  rate-limit por IP.

## Seguridad y privacidad

- **RLS** en todas las tablas: cada quien ve solo lo suyo (sus vehículos, los
  reportes que hizo y los reportes/avisos sobre sus vehículos).
- **Heatmap anonimizado**: la vista `reports_heatmap` expone solo lat/lng
  redondeados (~11 m), tipo y fecha — sin patentes ni identificadores.
- **Verificación de titularidad**: pendiente (fase 2). Hoy cualquiera puede
  registrar una patente; el badge "sin verificar" lo refleja en la UI. **No
  habilitar en producción real sin este mecanismo.**
- Considerar términos de uso y **Ley 25.326** (datos personales, AR) antes de un
  lanzamiento público: las fotos pueden mostrar personas y patentes de terceros.

## Roadmap

Ver el prompt de producto original. Próximas fases: verificación de titularidad,
heatmap con agregación (H3/hexbin), reputación/anti-abuso, moderación, y ALPR
(detección de patente por foto con confirmación manual).
