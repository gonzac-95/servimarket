import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { Avatar, Button, Rating, Sheet, toast } from "../components/mobile/kit";
import { Icon } from "../components/mobile/Icon";
import { MobileScreen, TabBar } from "../components/mobile/MobileScreen";

function Row({ icon, label, value, badge, onClick }: { icon: string; label: string; value?: string; badge?: string; onClick: () => void }) {
  const t = useTheme();
  return (
    <button onClick={onClick} style={{ all: "unset", cursor: "pointer", width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${t.lineSoft}` }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: t.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={16} color={t.ink} />
      </div>
      <span style={{ flex: 1, fontFamily: t.fontBody, fontSize: 14.5, color: t.ink }}>{label}</span>
      {badge && <span style={{ padding: "3px 8px", background: t.greenSoft, color: t.green, fontFamily: t.fontBody, fontSize: 10.5, fontWeight: 700, borderRadius: 999, textTransform: "uppercase" }}>{badge}</span>}
      {value && <span style={{ fontFamily: t.fontBody, fontSize: 13, color: t.inkMute }}>{value}</span>}
      <Icon name="chevron-right" size={16} color={t.inkSoft} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontFamily: t.fontBody, fontSize: 11.5, fontWeight: 700, color: t.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, padding: "0 4px" }}>{title}</div>
      <div style={{ background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

export default function Settings() {
  const t = useTheme();
  const { user, provider, signOut } = useAuth();
  const navigate = useNavigate();
  const isClient = user?.role === "client";
  const initials = (user?.name ?? "U").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function logout() { await signOut(); navigate("/"); }

  async function deleteAccount() {
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("delete-account");
    setDeleting(false);
    if (error || !data?.ok) { toast("No se pudo eliminar la cuenta. Escribinos a soporte.", "shield"); return; }
    await signOut();
    navigate("/", { replace: true });
    toast("Tu cuenta fue eliminada");
  }

  return (
    <MobileScreen>
      <div style={{ position: "absolute", inset: 0, background: t.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "54px 20px 8px" }}>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: 32, fontWeight: 700, color: t.ink, letterSpacing: "-0.02em" }}>Perfil</h1>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 100px" }}>
          {/* tarjeta de perfil */}
          <div style={{ background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius, padding: 18, display: "flex", alignItems: "center", gap: 14, boxShadow: t.shadow }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" style={{ width: 62, height: 62, borderRadius: 999, objectFit: "cover", flexShrink: 0 }} />
              : <Avatar initials={initials} hue={t.green} size={62} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: t.fontBody, fontSize: 17, fontWeight: 700, color: t.ink }}>{user?.name}</div>
              <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.inkMute, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
              {!isClient && provider && <div style={{ marginTop: 6 }}><Rating value={provider.rating_avg ?? 0} count={provider.reviews_count ?? 0} size={12} /></div>}
            </div>
            <button onClick={() => navigate("/settings/edit")} style={{ all: "unset", cursor: "pointer", width: 38, height: 38, borderRadius: 999, background: t.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="edit" size={16} color={t.ink} />
            </button>
          </div>

          {/* rol */}
          <div style={{ marginTop: 18, padding: 16, background: t.surfaceDeep, color: "#fff", borderRadius: t.radius, display: "flex", alignItems: "center", gap: 12, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: 999, background: `radial-gradient(circle, ${t.greenBright}66, transparent 70%)` }} />
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
              <Icon name={isClient ? "user" : "briefcase"} size={20} color="#fff" />
            </div>
            <div style={{ flex: 1, zIndex: 1 }}>
              <div style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: 700 }}>{isClient ? "Cuenta de cliente" : "Cuenta de prestador"}</div>
              <div style={{ fontFamily: t.fontBody, fontSize: 11.5, opacity: 0.65, marginTop: 2 }}>{isClient ? "Buscás y pedís servicios" : "Ofrecés servicios en la plataforma"}</div>
            </div>
          </div>

          <Section title="Cuenta">
            <Row icon="user" label="Información personal" onClick={() => navigate("/settings/edit")} />
            <Row icon="bell" label="Notificaciones" onClick={() => navigate("/notifications")} />
            {isClient && <Row icon="star" label="Favoritos" onClick={() => navigate("/favorites")} />}
          </Section>

          <Section title="Legal">
            <Row icon="shield" label="Privacidad" onClick={() => navigate("/privacidad")} />
            <Row icon="chat" label="Términos y condiciones" onClick={() => navigate("/terminos")} />
          </Section>

          <Section title="Soporte">
            <Row icon="chat" label="Centro de ayuda" onClick={() => navigate("/help")} />
          </Section>

          <button onClick={logout} style={{ all: "unset", cursor: "pointer", marginTop: 18, width: "100%", boxSizing: "border-box", textAlign: "center", padding: 16, borderRadius: t.radius, background: "rgba(192,57,43,0.06)", fontFamily: t.fontBody, fontSize: 14, fontWeight: 700, color: t.danger, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="logout" size={16} color={t.danger} /> Cerrar sesión
          </button>
          <button onClick={() => setConfirmDelete(true)} style={{ all: "unset", cursor: "pointer", marginTop: 10, width: "100%", boxSizing: "border-box", textAlign: "center", padding: 12, fontFamily: t.fontBody, fontSize: 13, color: t.inkMute, textDecoration: "underline" }}>
            Eliminar mi cuenta
          </button>
          <div style={{ marginTop: 18, textAlign: "center", fontFamily: t.fontMono, fontSize: 10.5, color: t.inkSoft, letterSpacing: "0.06em" }}>ServiMarket · v1.0.0</div>
        </div>

        {/* confirmación de eliminación de cuenta */}
        <Sheet open={confirmDelete} onClose={() => !deleting && setConfirmDelete(false)}>
          <div style={{ padding: "0 24px" }}>
            <div style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 700, color: t.ink, letterSpacing: "-0.02em" }}>¿Eliminar tu cuenta?</div>
            <p style={{ marginTop: 10, fontFamily: t.fontBody, fontSize: 14, color: t.inkMute, lineHeight: 1.5 }}>
              Esta acción es <strong style={{ color: t.ink }}>permanente</strong>. Se borran tus datos personales
              (nombre, email, teléfono, fotos) y no vas a poder volver a ingresar con esta cuenta.
              El historial de trabajos queda anonimizado.
            </p>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <Button variant="outline" size="lg" full onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancelar</Button>
              <button onClick={deleteAccount} disabled={deleting} style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", width: "100%", textAlign: "center", padding: 15, borderRadius: t.radius, background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.25)`, fontFamily: t.fontBody, fontSize: 14.5, fontWeight: 700, color: t.danger, opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "Eliminando..." : "Sí, eliminar definitivamente"}
              </button>
            </div>
          </div>
        </Sheet>

        <TabBar active="profile" role={isClient ? "client" : "provider"} />
      </div>
    </MobileScreen>
  );
}
