# Configuración de email y Auth para el lanzamiento web

Todo esto se hace una sola vez desde los paneles web. El orden importa.

## 1. Resend: verificar el dominio

1. En [resend.com/domains](https://resend.com/domains), elegí **Add domain** y cargá `servimarket.app` con la región `us-east-1`.
2. Resend te muestra entre 3 y 4 registros DNS (MX, TXT/SPF y TXT/DKIM, y opcionalmente DMARC).
3. El DNS de `servimarket.app` lo administra Vercel. Pasame esos registros en el chat y los cargo yo, o cargalos vos en Vercel → Domains → servimarket.app → DNS Records.
4. Volvé a Resend y tocá **Verify**. Puede tardar unos minutos.
5. En Resend → API Keys, creá una key **nueva** con permiso *Sending access* y dominio `servimarket.app`.
   La key vieja estaba en `Api key resend mail.docx` dentro del repo: borrala en Resend y sacá ese archivo de la carpeta del proyecto.

## 2. Supabase Auth: SMTP propio

En Supabase → Project Settings → Authentication → SMTP Settings, activá **Enable Custom SMTP** y completá:

| Campo | Valor |
|---|---|
| Sender email | `no-responder@servimarket.app` |
| Sender name | `ServiMarket` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | la API key nueva de Resend |

Después, en Authentication → Rate Limits, subí **Emails sent per hour** a 100. Con el SMTP por defecto el límite es de 2 por hora y los registros quedan trabados.

## 3. Supabase Auth: URLs

En Authentication → URL Configuration:

- **Site URL:** `https://servimarket.app`
- **Redirect URLs** (agregá todas):
  - `https://servimarket.app/**`
  - `https://*-gonzac-95s-projects.vercel.app/**` (previews de Vercel)
  - `http://localhost:5173/**`
  - `com.servimarket.app://auth-callback` (app Android)

## 4. Supabase Auth: confirmación de email

En Authentication → Sign In / Providers → Email:

- Activá **Confirm email**.
- Activá **Secure email change**.
- La **longitud mínima de contraseña** conviene dejarla en 8.

El registro ya contempla este caso: si no hay sesión después del alta, muestra "revisá tu mail".

## 5. Plantillas de email (opcional, recomendado)

En Authentication → Email Templates, traducí al español al menos **Confirm signup** y **Reset password**. Por ejemplo:

> **Asunto:** Confirmá tu cuenta en ServiMarket
> Hola, confirmá tu email para empezar a usar ServiMarket: `{{ .ConfirmationURL }}`

## 6. Prueba

1. Registrate con un email tuyo nuevo desde servimarket.app. Tiene que llegarte el mail desde `no-responder@servimarket.app`.
2. Probá "¿Olvidaste tu contraseña?". El link tiene que abrir `servimarket.app/reset-password`.
3. Probá el login con Google desde la web.
