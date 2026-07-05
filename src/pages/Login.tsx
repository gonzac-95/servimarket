import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useAuth, PUBLIC_WEB_URL } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/theme";
import { Button, Field, GoogleG, toast } from "../components/mobile/kit";
import { Icon } from "../components/mobile/Icon";
import { OAUTH_CALLBACK } from "../components/NativeBridge";

export default function Login() {
  const t = useTheme();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/home";
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [resending, setResending] = useState(false);

  // Vuelta desde el link de confirmación del email
  useEffect(() => {
    if (searchParams.get("confirmed")) toast("¡Email confirmado! Ya podés ingresar.", "check");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin() {
    if (loading) return;
    setLoading(true);
    const { error } = await signIn(email.trim(), pass);
    setLoading(false);
    if (error) {
      if (/not confirmed/i.test(error.message)) {
        setNeedsConfirm(true);
        toast("Tenés que confirmar tu email antes de ingresar", "close");
      } else {
        toast("Email o contraseña incorrectos", "close");
      }
      return;
    }
    navigate(redirect, { replace: true });
  }

  async function resendConfirmation() {
    if (resending || !email.trim()) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${PUBLIC_WEB_URL}/login?confirmed=1` },
    });
    setResending(false);
    if (error) { toast("No se pudo reenviar. Probá en unos minutos.", "close"); return; }
    toast("Te reenviamos el correo de confirmación", "check");
  }

  async function handleGoogle() {
    const isNative = Capacitor.isNativePlatform();
    // En la app nativa el OAuth se abre en el navegador del sistema (Google
    // bloquea webviews) y vuelve por deep link, que procesa NativeBridge.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: isNative ? OAUTH_CALLBACK : `${window.location.origin}/dashboard`,
        skipBrowserRedirect: isNative,
      },
    });
    if (error) { toast("Error al iniciar con Google", "close"); return; }
    if (isNative && data?.url) await Browser.open({ url: data.url });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: t.bg, display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ padding: "54px 20px 0" }}>
        <button onClick={() => navigate("/")} style={{ all: "unset", cursor: "pointer", width: 40, height: 40, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="arrow-left" size={20} color={t.ink} />
        </button>
      </div>
      <div style={{ padding: "36px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: 38, fontWeight: 700, color: t.ink, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            Bienvenido<br />de vuelta
          </h1>
          <div style={{ width: 60, height: 60, flexShrink: 0, borderRadius: 15, background: `linear-gradient(135deg, ${t.greenBright}, ${t.greenDeep})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px -8px rgba(14,92,44,0.4)" }}>
            <svg width="38" height="38" viewBox="0 0 120 120" fill="none">
              <path d="M 22 56 L 60 22 L 98 56 L 98 94 a4 4 0 0 1 -4 4 L 26 98 a4 4 0 0 1 -4 -4 Z" fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
              <path d="M 76 50 Q 76 44 70 44 L 52 44 Q 44 44 44 52 Q 44 60 52 62 L 68 64 Q 78 66 78 74 Q 78 82 70 82 L 42 82" fill="none" stroke="#fff" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <p style={{ marginTop: 10, fontFamily: t.fontBody, fontSize: 15, color: t.inkMute }}>Ingresá con tu correo y contraseña.</p>
      </div>
      <div style={{ padding: "32px 24px 0", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Correo electrónico" value={email} onChange={setEmail} type="email" placeholder="vos@ejemplo.com" onEnter={handleLogin} />
        <Field label="Contraseña" value={pass} onChange={setPass} type={showPass ? "text" : "password"} placeholder="Tu contraseña" onEnter={handleLogin}
          right={<button onClick={() => setShowPass(s => !s)} style={{ all: "unset", cursor: "pointer", display: "flex", padding: 6 }}><Icon name="eye" size={18} color={t.inkSoft} /></button>} />
        <div style={{ textAlign: "right" }}>
          <button onClick={() => navigate("/forgot-password")} style={{ all: "unset", cursor: "pointer", fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 600, color: t.green }}>¿Olvidaste tu contraseña?</button>
        </div>
        {needsConfirm && (
          <div style={{ padding: 14, background: "rgba(232,168,43,0.10)", border: "1px solid rgba(232,168,43,0.30)", borderRadius: t.radiusSm }}>
            <div style={{ fontFamily: t.fontBody, fontSize: 13, color: "#9B6B12", lineHeight: 1.5 }}>
              Tu cuenta todavía no está confirmada. Buscá el correo que te mandamos (revisá spam) o pedí uno nuevo.
            </div>
            <button onClick={resendConfirmation} disabled={resending} style={{ all: "unset", cursor: "pointer", marginTop: 8, fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 700, color: t.green, opacity: resending ? 0.6 : 1 }}>
              {resending ? "Enviando..." : "Reenviar correo de confirmación"}
            </button>
          </div>
        )}
      </div>
      <div style={{ padding: "0 24px 30px", display: "flex", flexDirection: "column", gap: 16 }}>
        <Button variant="green" size="lg" full onClick={handleLogin} disabled={loading}>{loading ? "Ingresando..." : "Ingresar"}</Button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: t.inkSoft, fontFamily: t.fontBody, fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: t.line }} /><span>o continuá con</span><div style={{ flex: 1, height: 1, background: t.line }} />
        </div>
        <Button variant="outline" size="md" full icon={<GoogleG />} onClick={handleGoogle}>Continuar con Google</Button>
        <div style={{ textAlign: "center", fontFamily: t.fontBody, fontSize: 14, color: t.inkMute }}>
          ¿Sos nuevo? <button onClick={() => navigate("/register")} style={{ all: "unset", cursor: "pointer", color: t.green, fontWeight: 700 }}>Crear cuenta</button>
        </div>
      </div>
    </div>
  );
}
