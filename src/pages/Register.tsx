import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { Button, Field, toast } from "../components/mobile/kit";
import { Icon } from "../components/mobile/Icon";

export default function Register() {
  const t = useTheme();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<"client" | "provider">("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [accept, setAccept] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (loading) return;
    if (pass.length < 8) { toast("La contraseña debe tener 8+ caracteres", "close"); return; }
    if (!accept) { toast("Aceptá los términos para continuar", "close"); return; }
    setLoading(true);
    const { error } = await signUp(email.trim(), pass, name.trim(), role);
    setLoading(false);
    if (error) { toast("No se pudo crear la cuenta", "close"); return; }
    toast("¡Cuenta creada!");
    navigate(role === "provider" ? "/settings" : "/dashboard", { replace: true });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: t.bg, display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ padding: "54px 20px 0" }}>
        <button onClick={() => navigate("/login")} style={{ all: "unset", cursor: "pointer", width: 40, height: 40, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="arrow-left" size={20} color={t.ink} />
        </button>
      </div>
      <div style={{ padding: "24px 24px 0" }}>
        <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: 34, fontWeight: 700, color: t.ink, letterSpacing: "-0.02em", lineHeight: 1.05 }}>Creá tu cuenta</h1>
        <p style={{ marginTop: 8, fontFamily: t.fontBody, fontSize: 14, color: t.inkMute }}>Empezá en menos de un minuto.</p>
      </div>
      <div style={{ padding: "20px 24px 0" }}>
        <div style={{ display: "flex", background: t.surfaceAlt, borderRadius: t.radiusSm, padding: 4, gap: 4 }}>
          {[
            { id: "client" as const, label: "Soy cliente", sub: "Busco un servicio" },
            { id: "provider" as const, label: "Soy prestador", sub: "Ofrezco servicios" },
          ].map(opt => {
            const on = role === opt.id;
            return (
              <button key={opt.id} onClick={() => setRole(opt.id)} style={{
                all: "unset", cursor: "pointer", flex: 1, padding: "12px 10px",
                background: on ? t.surface : "transparent", borderRadius: t.radiusSm - 2,
                boxShadow: on ? "0 1px 3px rgba(0,0,0,0.06)" : "none", textAlign: "center", transition: "all .15s",
              }}>
                <div style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: 700, color: on ? t.ink : t.inkMute }}>{opt.label}</div>
                <div style={{ fontFamily: t.fontBody, fontSize: 11.5, color: on ? t.inkMute : t.inkSoft, marginTop: 2 }}>{opt.sub}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ padding: "20px 24px 0", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nombre completo" value={name} onChange={setName} placeholder="Cómo te llamás" />
        <Field label="Correo electrónico" value={email} onChange={setEmail} type="email" placeholder="vos@ejemplo.com" />
        <Field label="Contraseña" value={pass} onChange={setPass} type="password" placeholder="8+ caracteres" />
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 4, cursor: "pointer" }}>
          <div onClick={() => setAccept(!accept)} style={{
            width: 22, height: 22, borderRadius: 6, marginTop: 1,
            background: accept ? t.green : t.surface, border: `1.5px solid ${accept ? t.green : t.line}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>{accept && <Icon name="check" size={14} color="#fff" stroke={2.5} />}</div>
          <span style={{ fontFamily: t.fontBody, fontSize: 13, color: t.inkMute, lineHeight: 1.4 }}>
            Acepto los <strong onClick={() => navigate("/terminos")} style={{ color: t.ink, textDecoration: "underline" }}>Términos</strong> y la <strong onClick={() => navigate("/privacidad")} style={{ color: t.ink, textDecoration: "underline" }}>Política de privacidad</strong>.
          </span>
        </label>
      </div>
      <div style={{ padding: "0 24px 30px" }}>
        <Button variant="green" size="lg" full onClick={handleSubmit} disabled={!accept || loading}>{loading ? "Creando..." : "Crear cuenta"}</Button>
      </div>
    </div>
  );
}
