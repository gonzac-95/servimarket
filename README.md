# ServiMarket 🔧

Marketplace de servicios del hogar para Argentina. Conecta clientes con prestadores (gasistas, electricistas, plomeros, fletes, pintores, y más).

---

## 🛠 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui (Radix) + lucide-react |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions) |
| Pagos | MercadoPago (Checkout Pro + OAuth Marketplace) |
| Publicidad | Google AdMob (`@capacitor-community/admob`) |
| Push | Firebase Cloud Messaging (`@capacitor/push-notifications`) |
| Mobile | Capacitor 6 (iOS + Android) |
| Deploy web | Vercel |

---

## 📁 Estructura del proyecto

```
servimarket/
├── src/
│   ├── lib/
│   │   ├── supabase.ts        # Cliente Supabase + helpers de storage
│   │   ├── auth.tsx           # Context de auth (incluye reset password)
│   │   ├── commission.ts      # Cálculo de comisión por tramos (frontend)
│   │   ├── mp-oauth.ts        # Helpers OAuth MercadoPago (conectar/desconectar)
│   │   ├── ads.ts             # AdMob: init + banners (no-op en web)
│   │   └── push.ts            # Push notifications nativas (no-op en web)
│   ├── components/
│   │   ├── ui/                # Componentes shadcn
│   │   ├── AdBanner.tsx       # Banner de AdMob reutilizable
│   │   └── LegalLayout.tsx    # Layout para páginas legales
│   ├── pages/
│   │   ├── Index.tsx          # Landing
│   │   ├── Login.tsx          # + link "¿Olvidaste tu contraseña?"
│   │   ├── Register.tsx       # + checkbox de aceptación de términos
│   │   ├── ForgotPassword.tsx # Solicitar reset de contraseña
│   │   ├── ResetPassword.tsx  # Crear nueva contraseña
│   │   ├── Search.tsx         # Búsqueda + filtro por calificación
│   │   ├── ProviderProfile.tsx
│   │   ├── JobCreate.tsx      # Crear solicitud
│   │   ├── JobDetail.tsx      # Chat + estado + pago + doble confirmación + reseña
│   │   ├── Dashboard.tsx      # Panel cliente/prestador + campana de notificaciones
│   │   ├── Settings.tsx       # Perfil + avatar + (conexión MP, oculta)
│   │   ├── Favorites.tsx
│   │   ├── PrivacyPolicy.tsx  # Política de privacidad
│   │   ├── Terms.tsx          # Términos y condiciones
│   │   └── Admin.tsx          # Admin: usuarios, prestadores, trabajos, comisiones
│   ├── types/index.ts
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── migrations/            # Migraciones incrementales (ver orden abajo)
│   └── functions/
│       ├── _shared/           # commission.ts, state.ts (HMAC)
│       ├── create-payment/    # Crea preferencia MP + comisión
│       ├── mp-webhook/        # Webhook de pagos MP
│       ├── mp-oauth-start/    # Inicia OAuth del prestador
│       ├── mp-oauth-callback/ # Recibe el code y guarda tokens
│       ├── mp-oauth-disconnect/
│       └── send-push/         # Envía push vía FCM HTTP v1
├── schema.sql                 # Schema consolidado (referencia)
├── capacitor.config.ts
├── vite.config.ts             # Excluye plugins nativos del bundle web
├── .env.example
└── package.json
```

---

## 🚀 Inicio rápido

```bash
npm install
cp .env.example .env   # completar con tus keys de Supabase
npm run dev            # → http://localhost:5173
```

### Variables de entorno (`.env`)

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
# AdMob (opcional, sólo producción mobile)
VITE_ADMOB_BANNER_ANDROID=ca-app-pub-XXXX/YYYY
VITE_ADMOB_BANNER_IOS=ca-app-pub-XXXX/YYYY
VITE_ADMOB_USE_REAL=false   # true para usar IDs reales en vez de test
```

---

## 🗄 Base de datos

Ejecutar en el **SQL Editor** de Supabase en este orden:

1. `schema.sql` — tablas base, RLS, triggers, datos iniciales
2. `supabase/migrations/20260508_commission_tiers.sql` — comisión escalonada + `app_config`
3. `supabase/migrations/20260510_provider_mp_oauth.sql` — credenciales OAuth del prestador
4. `supabase/migrations/20260522_job_double_confirmation.sql` — confirmación de trabajo
5. `supabase/migrations/20260522_avatars_storage_policies.sql` — políticas del bucket `avatars`
6. `supabase/migrations/20260522_notifications_triggers.sql` — notificaciones automáticas + push tokens

> El webhook de push (`pg_net` + trigger a `send-push`) se configura una vez que la edge function `send-push` esté deployada.

---

## ⚡ Edge Functions

| Función | Qué hace | Deploy |
|---------|----------|--------|
| `create-payment` | Crea preferencia MP con comisión por tramo | `supabase functions deploy create-payment` |
| `mp-webhook` | Recibe pagos de MP, valida firma, actualiza estado | `--no-verify-jwt` |
| `mp-oauth-start` | Genera URL OAuth para que el prestador conecte MP | normal |
| `mp-oauth-callback` | Intercambia code por tokens y los guarda | `--no-verify-jwt` |
| `mp-oauth-disconnect` | Borra credenciales MP del prestador | normal |
| `send-push` | Envía notificaciones push vía FCM | `--no-verify-jwt` |

### Secrets (Supabase)

```bash
# MercadoPago
supabase secrets set MP_ACCESS_TOKEN=TEST-...          # token del platform (Modelo A)
supabase secrets set MP_CLIENT_ID=...                  # OAuth Marketplace
supabase secrets set MP_CLIENT_SECRET=...              # OAuth Marketplace
supabase secrets set MP_OAUTH_REDIRECT_URI=https://TU_PROJECT.supabase.co/functions/v1/mp-oauth-callback
supabase secrets set MP_OAUTH_STATE_SECRET=<hex aleatorio>
supabase secrets set MP_WEBHOOK_SECRET=...             # firma del webhook MP
supabase secrets set APP_URL=http://localhost:5173
supabase secrets set MP_USE_MARKETPLACE=false          # true cuando MP apruebe Marketplace

# Firebase (push)
supabase secrets set FIREBASE_PROJECT_ID=...
supabase secrets set FIREBASE_CLIENT_EMAIL=...
supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 💰 Monetización

### 1. Comisión por transacción (modelo principal)

Comisión **fija escalonada por tramo de precio**, configurable desde el panel admin (`/admin/commission`) sin redeploy. Tramos por defecto (mayo 2026, ARS):

| Tramo del trabajo | Comisión |
|---|---|
| Hasta $30.000 | $2.500 |
| $30.001 – $100.000 | $7.000 |
| $100.001 – $300.000 | $15.000 |
| Más de $300.000 | $25.000 |

Se almacenan en `app_config.commission_tiers` y se snapshotean en cada pago (`payments.commission_tiers_snapshot`) para trazabilidad.

**Dos modos de cobro** (switch `MP_USE_MARKETPLACE`):
- **Modelo A (actual):** el cobro entra a la cuenta del platform; la comisión se registra y la liquidación al prestador se hace por fuera.
- **Modelo B (Marketplace):** con OAuth, MP divide automáticamente — el prestador recibe su parte y el platform la comisión. Requiere que MP apruebe el modo Marketplace para la app.

### 2. Publicidad (AdMob)

Banners en pantallas **no críticas** (Index, Search, Dashboard, Favorites). Nunca en JobCreate, JobDetail, ProviderProfile, Login/Register, Settings, Admin. Solo se muestran en builds nativas (no en web).

### 3. Suscripción premium para prestadores (roadmap)

Pendiente. Destacados, badge, estadísticas.

---

## 🔔 Notificaciones

### In-app (la campana del Dashboard)

Se generan **automáticamente vía triggers de base de datos** en: nuevo mensaje, nueva solicitud, cotización, cambios de estado del job (aceptado / en progreso / terminado / confirmado / cancelado) y nueva reseña. Tiempo real vía Supabase Realtime.

### Push nativas (FCM)

Cada notificación dispara `send-push` (trigger `pg_net` → edge function → FCM). Tokens de device en `push_tokens`. Requiere setup de Firebase:

1. Crear proyecto en [console.firebase.google.com](https://console.firebase.google.com)
2. Service Account → cargar `FIREBASE_*` como secrets
3. App Android → `google-services.json` en `android/app/`
4. (iOS) APNs key + cuenta Apple Developer

---

## ⭐ Calificaciones

Las calificaciones son el diferenciador central:
- Búsqueda **ordenada por mejor calificación** (rating + cantidad de reseñas como desempate)
- Filtro por calificación mínima (Todas / 4+ / 4.5+)
- La reseña **solo se habilita** si el trabajo fue confirmado por ambas partes **y** hubo un pago aprobado dentro de la app — así cada calificación proviene de un trabajo real.

---

## 📄 Páginas legales

- `/privacidad` — Política de Privacidad (Ley 25.326)
- `/terminos` — Términos y Condiciones

⚠️ **Son borradores estándar.** Antes de publicar: completar los datos entre `[corchetes]` (razón social, CUIT, domicilio, email de contacto en `PrivacyPolicy.tsx` y `Terms.tsx`) y revisar con un profesional legal.

---

## 📱 Compilar como app móvil (Capacitor)

```bash
npm run build
npm run cap:add:android      # solo la primera vez
npm run cap:sync
npm run cap:open:android
```

Para AdMob y push en Android, agregar en `AndroidManifest.xml` el App ID de AdMob y poner `google-services.json` en `android/app/`.

---

## 👥 Usuarios de prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@servimarket.com | Test1234! | admin |
| cliente1@test.com | Test1234! | client |
| gasista@test.com | Test1234! | provider (Carlos Rodríguez) |
| electricista@test.com | Test1234! | provider (Miguel Torres) |
| plomero@test.com | Test1234! | provider (Roberto García) |

## 💳 Tarjetas de prueba MercadoPago (sandbox)

| Resultado | Número | CVV | Vto. | Titular |
|------|--------|-----|------|---------|
| Aprobada | 4509 9535 6623 3704 | 123 | 11/30 | **APRO** |
| Rechazada | 4509 9535 6623 3704 | 123 | 11/30 | OTHE |
| Pendiente | 4509 9535 6623 3704 | 123 | 11/30 | CONT |

> En sandbox, pagar con un **usuario de prueba comprador** distinto del vendedor. El nombre del titular define el resultado.

---

## ✅ Estado del MVP

- [x] Auth con roles (cliente / prestador / admin) + recuperar contraseña
- [x] Búsqueda con filtro y orden por calificación
- [x] Jobs: cotizaciones, chat realtime, estados
- [x] Doble confirmación de finalización (prestador marca → cliente confirma)
- [x] Pagos con MercadoPago + comisión escalonada
- [x] Reseñas con respaldo de pago real
- [x] Avatar y fotos de trabajos
- [x] Notificaciones in-app + backend de push (FCM)
- [x] Panel admin (usuarios, prestadores, trabajos, comisiones)
- [x] Páginas legales (privacidad + términos)
- [x] AdMob en pantallas no críticas

---

## 🔜 Pendientes para producción

- [ ] **Rotar la clave de Firebase** si se expuso durante el setup
- [ ] Completar datos legales `[corchetes]` + revisión profesional
- [ ] Configurar SMTP propio en Supabase Auth (emails de reset)
- [ ] Agregar Redirect URLs de reset password en Supabase Auth
- [ ] Activar verificación de email en Supabase Auth
- [ ] IDs reales de AdMob + política de privacidad pública (URL Vercel)
- [ ] `google-services.json` (Android) y APNs (iOS) para recibir push
- [ ] Solicitar modo Marketplace a MercadoPago (split automático)
- [ ] Cumplimiento AFIP para marketplace (Res. Gral. 4549)
- [ ] Validación de firma en webhook MP + rate limiting

---

## 📄 Licencia

MIT
