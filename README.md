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
4. En **Authentication → Providers → Email**, habilitá el login por email y
   asegurate de tener activado **"Enable email OTP"** (código) y el **magic
   link**. En **URL Configuration** agregá la _Redirect URL_
   `https://TU_APP.vercel.app/auth/confirm` (y `http://localhost:3000/auth/confirm`
   para dev) para que el enlace mágico funcione.

### 2b. Email con Resend (magic link + OTP)

Los emails de acceso se envían con **Resend** a través del _Send Email Hook_ de
Supabase (todo en free tier). El cliente sigue usando `signInWithOtp` /
`verifyOtp` sin cambios; Supabase genera el código + token y llama a nuestro
endpoint [`/auth/send-email`](src/app/auth/send-email/route.ts), que verifica la
firma del webhook y manda un mail **branded** con **enlace mágico y código de 6
dígitos**. El enlace apunta a [`/auth/confirm`](src/app/auth/confirm/route.ts),
que canjea el token por la sesión. La plantilla vive en
[`src/lib/email.ts`](src/lib/email.ts) (`emailLayout` reutilizable para todos
los mails transaccionales).

1. Agregá la integración **Resend** en Vercel (o creá una cuenta en
   [resend.com](https://resend.com)). Eso setea `RESEND_API_KEY`.
2. Para producción, verificá **un dominio gratis** en Resend y poné
   `EMAIL_FROM=Alerta Patente <no-reply@tudominio.com>`. Sin dominio verificado,
   el free tier solo entrega desde `onboarding@resend.dev` al email de tu cuenta.
3. En Supabase, andá a **Authentication → Hooks → Send Email** (Beta),
   habilitalo como **HTTPS Hook** y apuntá la URL a
   `https://TU_APP.vercel.app/auth/send-email`.
4. Copiá el **secret** que genera Supabase (formato `v1,whsec_…`) a la variable
   `SEND_EMAIL_HOOK_SECRET`.

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

| Variable                              | Valor                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | `media` (o el bucket que creaste)                                              |
| `NEXT_PUBLIC_APP_NAME`                | `Alerta Patente`                                                               |
| `NEXT_PUBLIC_APP_URL`                 | la URL pública del deploy (ej. `https://tu-app.vercel.app`, sin barra final)   |
| `EMAIL_FROM`                          | remitente verificado en Resend (ej. `Alerta Patente <no-reply@tudominio.com>`) |
| `SEND_EMAIL_HOOK_SECRET`              | secret del Send Email Hook de Supabase (formato `v1,whsec_…`)                  |

> `NEXT_PUBLIC_APP_URL` se usa para armar los links de las notificaciones push
> **y el enlace mágico del email de login**. Ponelo con el dominio final de
> producción.
>
> `RESEND_API_KEY` la carga sola la integración **Resend** de Vercel. Si no usás
> la integración, agregala a mano.

### 3. Auth por email (magic link + OTP) — config única

El login manda un email con **enlace mágico y código de 6 dígitos**; ambos
resuelven contra Supabase. El mail lo genera Supabase pero lo **envía tu app con
Resend** vía el _Send Email Hook_, con la plantilla branded de
[`src/lib/email.ts`](src/lib/email.ts). Detalles del flujo en la sección
[2b](#2b-email-con-resend-magic-link--otp). En producción, una sola vez:

1. **Resend**: agregá la integración en Vercel (setea `RESEND_API_KEY`) y
   verificá **un dominio gratis**; usá ese dominio en `EMAIL_FROM`. Sin dominio
   verificado, el free tier solo entrega desde `onboarding@resend.dev` a tu
   propio email.
2. **Supabase → Authentication → Providers → Email**: activá _Enable email OTP_
   y el magic link.
3. **Supabase → Authentication → URL Configuration → Redirect URLs**: agregá
   `https://TU_APP.vercel.app/auth/confirm` (y `http://localhost:3000/auth/confirm`
   para dev).
4. **Supabase → Authentication → Hooks → Send Email**: habilitalo como **HTTPS
   Hook** apuntando a `https://TU_APP.vercel.app/auth/send-email`. Copiá el
   **secret** (`v1,whsec_…`) a la variable `SEND_EMAIL_HOOK_SECRET` en Vercel.

> Con el hook activo, la app controla el 100% del email; el template nativo de
> "confirmar mail" de Supabase deja de usarse.

### 4. Base de datos (manual, una sola vez)

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

### 5. Deploy

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
    auth/send-email/      # Send Email Hook de Supabase → manda mail con Resend
    auth/confirm/         # verificador del enlace mágico (canjea token → sesión)
    login/                # login por magic link + OTP (se queda dentro de la PWA)
    sw.ts                 # service worker (push, offline, background sync)
    manifest.ts           # Web App Manifest
  components/             # UI (MapPicker, Dashboard, formularios, etc.)
  lib/
    supabase/             # clients: browser, server, admin (service role), middleware
    email.ts             # Resend + plantilla branded (emailLayout) + auth email
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
