import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useTheme, fmtARS } from "../lib/theme";
import { categoryByDbName } from "../lib/categories";
import { Avatar } from "../components/mobile/kit";
import { Icon, CategoryIcon } from "../components/mobile/Icon";
import { MobileScreen, TabBar } from "../components/mobile/MobileScreen";
import { usePaymentsEnabled } from "../lib/features";
import { useIsDesktop } from "../lib/useIsDesktop";
import { PushPrompt } from "../components/NotificationSettings";

type Period = "month" | "year" | "all";

export default function ProviderHome() {
  const t = useTheme();
  const { user, provider } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [requests, setRequests] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [docStatus, setDocStatus] = useState<"none" | "pending" | "rejected">("none");
  const [loading, setLoading] = useState(true);
  const { enabled: paymentsEnabled } = usePaymentsEnabled();
  const desktop = useIsDesktop();

  useEffect(() => {
    if (!provider?.id) { setLoading(false); return; }
    async function load() {
      // Ganancias reales: pagos aprobados de trabajos de este prestador
      const { data: pays } = await supabase
        .from("payments")
        .select("provider_share, status, created_at, jobs!inner(provider_id)")
        .eq("jobs.provider_id", provider!.id)
        .eq("status", "approved");
      setPayments(pays ?? []);

      // Solicitudes pendientes dirigidas a este prestador
      const { data: reqs } = await supabase
        .from("jobs")
        .select("*, clients:users!jobs_client_id_fkey(id,name,avatar_url,city)")
        .eq("provider_id", provider!.id).eq("status", "pending")
        .order("created_at", { ascending: false });
      setRequests(reqs ?? []);

      // Trabajos cerrados (se usan como métrica cuando no hay cobro in-app)
      const { data: done } = await supabase
        .from("jobs").select("id, updated_at, client_confirmed_at")
        .eq("provider_id", provider!.id).eq("status", "completed");
      setCompleted(done ?? []);

      // Estado del DNI para el aviso de verificación
      if (!provider!.documents_verified) {
        const { data: docs } = await supabase.from("verification_documents")
          .select("status").eq("provider_id", provider!.id).eq("document_type", "dni");
        const st = (docs ?? []).map((d: any) => d.status);
        setDocStatus(st.includes("pending") ? "pending" : st.includes("rejected") ? "rejected" : "none");
      }
      setLoading(false);
    }
    load();
  }, [provider?.id, provider?.documents_verified]);

  // Ganancias del período elegido (mes actual, año actual o histórico)
  const now = new Date();
  const inPeriod = payments.filter((p: any) => {
    const d = new Date(p.created_at);
    if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "year") return d.getFullYear() === now.getFullYear();
    return true;
  });
  const doneInPeriod = completed.filter((j: any) => {
    const d = new Date(j.client_confirmed_at ?? j.updated_at);
    if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "year") return d.getFullYear() === now.getFullYear();
    return true;
  }).length;
  const earnTotal = inPeriod.reduce((s: number, p: any) => s + Number(p.provider_share ?? 0), 0);
  const earnJobs = inPeriod.length;
  const periodLabel = paymentsEnabled
    ? (period === "month" ? "Ganancias del mes" : period === "year" ? `Ganancias ${now.getFullYear()}` : "Ganancias históricas")
    : (period === "month" ? "Trabajos del mes" : period === "year" ? `Trabajos ${now.getFullYear()}` : "Trabajos totales");

  const initials = (user?.name ?? "P").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <MobileScreen>
      <div style={{ position: "absolute", inset: 0, background: t.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "var(--sm-top, 54px) 20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          {user?.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: 999, objectFit: "cover" }} /> : <Avatar initials={initials} hue={t.green} size={40} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.inkMute }}>Buen día,</div>
            <div style={{ fontFamily: t.fontBody, fontSize: 15, fontWeight: 700, color: t.ink, marginTop: 1 }}>{user?.name}</div>
          </div>
          {!desktop && <button onClick={() => navigate("/notifications")} style={{ all: "unset", cursor: "pointer", width: 42, height: 42, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="bell" size={20} color={t.ink} />
          </button>}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: desktop ? "4px 0 48px" : "4px 0 100px",
          ...(desktop ? { display: "grid", gridTemplateColumns: "400px 1fr", gap: 8, alignItems: "start" } : {}) }}>
          {/* columna izquierda en escritorio: avisos + métricas */}
          <div>
          {/* Verificación de identidad */}
          {provider && !provider.documents_verified && (
            <div onClick={() => navigate("/verificacion")} style={{ margin: "0 20px 12px", padding: 16, background: t.surfaceDeep, color: "#fff", borderRadius: t.radius, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={docStatus === "pending" ? "clock" : "shield"} size={20} color={docStatus === "pending" ? "#E8A82B" : t.greenBright} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: 700 }}>
                  {docStatus === "pending" ? "Estamos revisando tu DNI" : docStatus === "rejected" ? "Tu DNI fue rechazado" : "Verificá tu identidad"}
                </div>
                <div style={{ fontFamily: t.fontBody, fontSize: 12, opacity: 0.7, marginTop: 2, lineHeight: 1.4 }}>
                  {docStatus === "pending" ? "Te avisamos cuando esté aprobado. Mientras tanto no aparecés en búsquedas." : docStatus === "rejected" ? "Revisá el motivo y volvé a subirlo." : "Subí tu DNI para aparecer en las búsquedas y recibir pedidos."}
                </div>
              </div>
              <Icon name="chevron-right" size={16} color="rgba(255,255,255,0.6)" />
            </div>
          )}

          {/* Invitación a activar notificaciones del navegador */}
          <PushPrompt style={{ margin: "0 20px 12px" }} message="Activá las notificaciones para enterarte de cada pedido al instante." />

          {/* Perfil incompleto */}
          {provider && (!provider.bio || provider.categories.length === 0) && (
            <div style={{ margin: "0 20px 16px", padding: 14, background: "rgba(232,168,43,0.10)", border: "1px solid rgba(232,168,43,0.30)", borderRadius: t.radius, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => navigate("/settings/edit")}>
              <Icon name="shield" size={20} color="#9B6B12" />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 700, color: "#9B6B12" }}>Completá tu perfil</div>
                <div style={{ fontFamily: t.fontBody, fontSize: 11.5, color: "#9B6B12", opacity: 0.85 }}>Los clientes no pueden encontrarte hasta que lo completes</div>
              </div>
              <Icon name="chevron-right" size={16} color="#9B6B12" />
            </div>
          )}

          {/* Ganancias (mes / año / histórico) */}
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ padding: 22, background: t.surfaceDeep, color: "#fff", borderRadius: t.radiusLg, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -40, top: -30, width: 220, height: 220, borderRadius: 999, background: `radial-gradient(circle, ${t.greenBright}55, transparent 70%)` }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontFamily: t.fontMono, fontSize: 10.5, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 600 }}>{periodLabel}</span>
                  {/* selector de período */}
                  <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.08)", borderRadius: 999, padding: 3 }}>
                    {([["month", "Mes"], ["year", "Año"], ["all", "Total"]] as [Period, string][]).map(([id, label]) => (
                      <button key={id} onClick={() => setPeriod(id)} style={{
                        all: "unset", cursor: "pointer", padding: "4px 10px", borderRadius: 999,
                        fontFamily: t.fontBody, fontSize: 11, fontWeight: 700,
                        background: period === id ? "rgba(255,255,255,0.92)" : "transparent",
                        color: period === id ? t.ink : "rgba(255,255,255,0.65)",
                      }}>{label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ fontFamily: t.fontDisplay, fontSize: 44, fontWeight: 700, marginTop: 8, letterSpacing: "-0.025em", lineHeight: 1 }}>{paymentsEnabled ? fmtARS(earnTotal) : doneInPeriod}</div>
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.12)", display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{paymentsEnabled ? "Trabajos cobrados" : "Solicitudes nuevas"}</div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 16, fontWeight: 700, marginTop: 4 }}>{paymentsEnabled ? earnJobs : requests.length}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: t.fontBody, fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Rating</div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 16, fontWeight: 700, marginTop: 4 }}>{(provider?.rating_avg ?? 0).toFixed(1)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          </div>

          {/* columna derecha en escritorio: solicitudes */}
          <div>
          {/* Solicitudes */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 20px", marginBottom: 12 }}>
            <h2 style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 700, color: t.ink, margin: 0, letterSpacing: "-0.02em" }}>
              Nuevas solicitudes
              {requests.length > 0 && <span style={{ fontFamily: t.fontBody, fontSize: 13, fontWeight: 700, color: "#fff", background: t.green, borderRadius: 999, padding: "2px 8px", marginLeft: 8, verticalAlign: "middle" }}>{requests.length}</span>}
            </h2>
            <button onClick={() => navigate("/dashboard")} style={{ all: "unset", cursor: "pointer", fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 600, color: t.green }}>Ver todo</button>
          </div>
          <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            {loading ? (
              <div style={{ padding: "20px 0", textAlign: "center", fontFamily: t.fontBody, color: t.inkMute }}>Cargando...</div>
            ) : requests.length === 0 ? (
              <div style={{ padding: 20, background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius, textAlign: "center", fontFamily: t.fontBody, fontSize: 13.5, color: t.inkMute }}>
                No tenés solicitudes nuevas. Cuando un cliente te elija, aparecen acá.
              </div>
            ) : requests.map(r => {
              const cat = categoryByDbName(r.category);
              return (
                <button key={r.id} onClick={() => navigate(`/jobs/${r.id}`)} style={{ all: "unset", cursor: "pointer", display: "block", boxSizing: "border-box", width: "100%", background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${cat?.hue ?? t.green}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CategoryIcon name={cat?.id ?? "gasista"} size={22} color={cat?.hue ?? t.green} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.inkMute, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{cat?.label ?? r.category}</div>
                      <div style={{ fontFamily: t.fontBody, fontSize: 14.5, fontWeight: 700, color: t.ink, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.description}</div>
                      <div style={{ fontFamily: t.fontBody, fontSize: 12.5, color: t.inkMute, marginTop: 2 }}>{(r as any).clients?.name ?? "Cliente"} · {r.address}</div>
                    </div>
                    <Icon name="chevron-right" size={18} color={t.inkSoft} />
                  </div>
                </button>
              );
            })}
          </div>
          </div>
        </div>

        <TabBar active="home" role="provider" />
      </div>
    </MobileScreen>
  );
}
