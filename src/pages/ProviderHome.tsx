import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useTheme, fmtARS } from "../lib/theme";
import { categoryByDbName } from "../lib/categories";
import { Avatar } from "../components/mobile/kit";
import { Icon, CategoryIcon } from "../components/mobile/Icon";
import { MobileScreen, TabBar } from "../components/mobile/MobileScreen";

type Period = "month" | "year" | "all";

export default function ProviderHome() {
  const t = useTheme();
  const { user, provider } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }
    load();
  }, [provider?.id]);

  // Ganancias del período elegido (mes actual, año actual o histórico)
  const now = new Date();
  const inPeriod = payments.filter((p: any) => {
    const d = new Date(p.created_at);
    if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "year") return d.getFullYear() === now.getFullYear();
    return true;
  });
  const earnTotal = inPeriod.reduce((s: number, p: any) => s + Number(p.provider_share ?? 0), 0);
  const earnJobs = inPeriod.length;
  const periodLabel = period === "month" ? "Ganancias del mes" : period === "year" ? `Ganancias ${now.getFullYear()}` : "Ganancias históricas";

  const initials = (user?.name ?? "P").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <MobileScreen>
      <div style={{ position: "absolute", inset: 0, background: t.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "54px 20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          {user?.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: 999, objectFit: "cover" }} /> : <Avatar initials={initials} hue={t.green} size={40} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.inkMute }}>Buen día,</div>
            <div style={{ fontFamily: t.fontBody, fontSize: 15, fontWeight: 700, color: t.ink, marginTop: 1 }}>{user?.name}</div>
          </div>
          <button onClick={() => navigate("/notifications")} style={{ all: "unset", cursor: "pointer", width: 42, height: 42, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="bell" size={20} color={t.ink} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 0 100px" }}>
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
                <div style={{ fontFamily: t.fontDisplay, fontSize: 44, fontWeight: 700, marginTop: 8, letterSpacing: "-0.025em", lineHeight: 1 }}>{fmtARS(earnTotal)}</div>
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.12)", display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Trabajos cobrados</div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 16, fontWeight: 700, marginTop: 4 }}>{earnJobs}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: t.fontBody, fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Rating</div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 16, fontWeight: 700, marginTop: 4 }}>{(provider?.rating_avg ?? 0).toFixed(1)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

        <TabBar active="home" role="provider" />
      </div>
    </MobileScreen>
  );
}
