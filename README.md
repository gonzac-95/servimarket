# ServiMarket 🔧

Marketplace de servicios del hogar para Argentina. Conecta clientes con prestadores (gasistas, electricistas, plomeros, fletes, y más).

---

## 🛠 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Pagos | MercadoPago Sandbox (+ Stripe como fallback) |
| Mobile | Capacitor (iOS + Android) |

---

## 📁 Estructura del proyecto

```
servimarket/
├── src/
│   ├── lib/
│   │   ├── supabase.ts       # Cliente Supabase
│   │   └── auth.tsx          # Context de autenticación
│   ├── pages/
│   │   ├── Index.tsx         # Landing page
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Search.tsx        # Búsqueda de prestadores
│   │   ├── ProviderProfile.tsx
│   │   ├── JobCreate.tsx     # Crear solicitud
│   │   ├── JobDetail.tsx     # Chat + estado del trabajo
│   │   ├── Dashboard.tsx     # Panel cliente/prestador
│   │   ├── Settings.tsx
│   │   └── Admin.tsx         # Panel de administración
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── App.tsx               # Router principal
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── schema.sql            # Base de datos + RLS + triggers
│   ├── seed.sql              # Datos de prueba
│   └── functions/
│       ├── create-payment/   # Edge Function: crear preferencia MP
│       └── mp-webhook/       # Edge Function: webhook MercadoPago
├── capacitor.config.ts
├── .env.example
└── package.json
```

---

## 🚀 Inicio rápido

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/tu-usuario/servimarket.git
cd servimarket
npm install
```

### 2. Crear proyecto en Supabase

1. Andá a [supabase.com](https://supabase.com) → New Project
2. Copiá tu **Project URL** y **anon public key** desde Settings > API

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editá .env con tus keys de Supabase y MercadoPago
```

### 4. Ejecutar el schema de la base de datos

En el **SQL Editor** de Supabase, ejecutá:
1. `supabase/schema.sql` — crea todas las tablas, RLS y triggers
2. `supabase/seed.sql` — carga datos de prueba (primero creá los usuarios en Auth)

### 5. Correr en desarrollo

```bash
npm run dev
# → http://localhost:5173
```

---

## 📱 Compilar como app móvil (Capacitor)

### Pre-requisitos

| Plataforma | Requisito |
|-----------|-----------|
| Android | Android Studio + JDK 17 |
| iOS | Xcode 15+ (solo macOS) |

### Pasos

```bash
# 1. Build del proyecto web
npm run build

# 2. Agregar plataformas (solo la primera vez)
npm run cap:add:android
npm run cap:add:ios   # solo en macOS

# 3. Sincronizar código al proyecto nativo
npm run cap:sync

# 4. Abrir en Android Studio / Xcode
npm run cap:open:android
npm run cap:open:ios
```

Desde Android Studio / Xcode podés compilar el APK/IPA y publicar en las stores.

---

## 💳 Pagos con MercadoPago (Sandbox)

### Configuración

1. Creá una cuenta en [developers.mercadopago.com](https://developers.mercadopago.com)
2. Obtené las **Test credentials** (Public key + Access token)
3. Cargalas en `.env`

### Deploy de Edge Functions

```bash
# Instalar CLI de Supabase
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref TU_PROJECT_REF

# Deploy functions
supabase functions deploy create-payment
supabase functions deploy mp-webhook

# Setear secrets en Supabase
supabase secrets set MP_ACCESS_TOKEN=TEST-xxxx
supabase secrets set APP_URL=https://tu-dominio.com
```

### Configurar Webhook en MercadoPago

En el panel de MercadoPago → Webhooks → agregar:
```
https://TU_PROJECT.supabase.co/functions/v1/mp-webhook
```
Seleccionar evento: `payment`

### Tarjetas de prueba para sandbox

| Tipo | Número | CVV | Vencimiento |
|------|--------|-----|-------------|
| Visa aprobada | 4509 9535 6623 3704 | 123 | 11/25 |
| Mastercard rechazada | 5031 7557 3453 0604 | 123 | 11/25 |

---

## 🌐 Deploy web (Vercel)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configurar variables de entorno en vercel.com/dashboard
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## 👥 Usuarios de prueba

Creá estos usuarios en Supabase Auth > Users, luego corré el `seed.sql`:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@servimarket.com | Test1234! | admin |
| cliente1@test.com | Test1234! | client |
| cliente2@test.com | Test1234! | client |
| prestador1@test.com | Test1234! | provider (Gasista) |
| prestador2@test.com | Test1234! | provider (Electricista) |
| prestador3@test.com | Test1234! | provider (Plomero) |
| prestador4@test.com | Test1234! | provider (Pintor) |
| prestador5@test.com | Test1234! | provider (Carpintero) |

---

## ✅ Criterios de aceptación (MVP)

- [x] Registro/login con roles (cliente / prestador)
- [x] Cliente busca prestadores por categoría, rating, disponibilidad
- [x] Cliente crea job → prestador recibe notificación → acepta/rechaza
- [x] Estados del job: pending → accepted → in_progress → completed
- [x] Chat en tiempo real entre cliente y prestador
- [x] Pago en sandbox via MercadoPago (webhook actualiza estado)
- [x] Cliente puntúa y deja comentario → rating promedio se actualiza
- [x] Panel de admin: gestionar usuarios, verificar prestadores
- [x] Código exportable y compilable como app web + iOS/Android

---

## 🔐 Seguridad (checklist para producción)

- [ ] Activar verificación de email en Supabase Auth
- [ ] Habilitar SMS auth (opcional, via Twilio)
- [ ] Revisar todas las políticas RLS en Supabase (ya incluidas en schema.sql)
- [ ] Configurar CORS en Supabase Functions
- [ ] Rotar keys antes de production
- [ ] Configurar rate limiting en Supabase
- [ ] Agregar validación de firma en webhook de MercadoPago
- [ ] Activar HTTPS en dominio propio
- [ ] Configurar alertas de errores (Sentry recomendado)
- [ ] Para facturar en Argentina: cumplir con requisitos de AFIP para marketplace (Res. Gral. 4549)

---

## 📊 Modelo de datos

```
users (1) ──────── (1) providers
                         │
                    (1) ─┤─ (N) jobs
                         │         │
                    clients (1)    ├─ (N) messages
                                   ├─ (1) reviews
                                   └─ (1) payments
```

---

## 🗺 Roadmap post-MVP

- [ ] Notificaciones push reales (Firebase FCM)
- [ ] Búsqueda geográfica por radio GPS real (PostGIS)
- [ ] Integración Stripe para pagos internacionales
- [ ] Sistema de disputas/reclamos
- [ ] Fotos de trabajos realizados en perfil
- [ ] Chat con imágenes
- [ ] Suscripción premium para prestadores
- [ ] Internacionalización (i18n en inglés)

---

## 🧪 Tests

```bash
npm run test
```

Los tests básicos cubren: auth flows, crear job, aceptar job, crear review.

---

## 📄 Licencia

MIT — Libre para uso personal y comercial.
