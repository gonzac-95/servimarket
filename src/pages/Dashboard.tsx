import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import type { Job } from "../types";
import { initPush } from "../lib/push";
import { useTheme, fmtARS } from "../lib/theme";
import { categoryByDbName } from "../lib/categories";
import { Button } from "../components/mobile/kit";
import { Icon, CategoryIcon } from "../components/mobile/Icon";
import { MobileScreen, TabBar } from "../components/mobile/MobileScreen";

function stateInfo(job: Job, t: ReturnType<typeof useTheme>) {
  if (job.status === "in_progress" && job.provider_completed_at)
    return { label: "Esperando confirmación", bg: "rgba(232,168,43,0.14)", fg: "#9B6B12" };
  switch (job.status) {
    case "accepted": return { label: "Aceptado", bg: t.greenSoft, fg: t.greenDeep };
    case "in_progress": return { label: "En curso", bg: t.greenSoft, fg: t.greenDeep };
    case "completed": return { label: "Completado", bg: t.surfaceAlt, fg: t.inkMute };
    case "cancelled": return { label: "Cancelado", bg: t.surfaceAlt, fg: t.inkMute };
    default: return { label: "Pendiente", bg: "rgba(43,143,224,0.10)", fg: "#1B5C97" };
  }
}

export default function Dashboard() {
  const t = useTheme();
  const { user, provider } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "done">("active");
  const isClient = user?.role === "client";

  useEffect(() => { if (user?.id) initPush(user.id); }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      let q = supabase.from("jobs").select("*, clients:users!jobs_client_id_fkey(id,name,avatar_url,city), providers(*, users(id,name,avatar_url,city))").order("created_at", { ascending: false });
      if (isClient) q = q.eq("client_id", user!.id);
      else q = q.eq("provider_id", provider?.id ?? "");
      const { data } = await q;
      setJobs((data as Job[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user, provider, isClient]);

  const active = jobs.filter(j => !["completed", "cancelled"].includes(j.status));
  const done = jobs.filter(j => ["completed", "cancelled"].includes(j.status));
  const list = tab === "active" ? active : done;

  return (
    <MobileScreen>
      <div style={{ position: "absolute", inset: 0, background: t.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "54px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: 32, fontWeight: 700, color: t.ink, letterSpacing: "-0.02em" }}>Mis trabajos</h1>
            {isClient && (
              <button onClick={() => navigate("/search")} style={{ all: "unset", cursor: "pointer", width: 42, height: 42, borderRadius: 999, background: t.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="plus" size={20} color="#fff" stroke={2.4} />
              </button>
            )}
          </div>
          <div style={{ marginTop: 16, display: "inline-flex", background: t.surfaceAlt, padding: 4, borderRadius: 999, gap: 4 }}>
            {([{ id: "active", label: `Activos (${active.length})` }, { id: "done", label: `Terminados (${done.length})` }] as const).map(o => {
              const on = tab === o.id;
              return (
                <button key={o.id} onClick={() => setTab(o.id)} style={{
                  all: "unset", cursor: "pointer", padding: "8px 16px", borderRadius: 999,
                  background: on ? t.surface : "transparent", boxShadow: on ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  fontFamily: t.fontBody, fontWeight: 700, fontSize: 13, color: on ? t.ink : t.inkMute,
                }}>{o.label}</button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 100px", display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", fontFamily: t.fontBody, color: t.inkMute }}>Cargando...</div>
          ) : list.length === 0 ? (
            <div style={{ padding: "70px 0", textAlign: "center", fontFamily: t.fontBody, color: t.inkMute }}>
              <div style={{ fontSize: 40 }}>📭</div>
              <div style={{ marginTop: 8 }}>No hay trabajos {tab === "active" ? "activos" : "terminados"} todavía.</div>
              {isClient && <div style={{ marginTop: 20 }}><Button variant="green" onClick={() => navigate("/search")}>Buscar un prestador</Button></div>}
            </div>
          ) : list.map(j => {
            const other = isClient ? (j.providers?.users?.name ?? "Sin asignar") : ((j as any).clients?.name ?? "Cliente");
            const cat = categoryByDbName(j.category);
            const st = stateInfo(j, t);
            return (
              <button key={j.id} onClick={() => navigate(`/jobs/${j.id}`)} style={{
                all: "unset", cursor: "pointer", display: "block", background: t.surface,
                border: `1px solid ${t.lineSoft}`, borderRadius: t.radius, padding: 16, boxShadow: t.shadow, boxSizing: "border-box",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${cat?.hue ?? t.green}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CategoryIcon name={cat?.id ?? "gasista"} size={20} color={cat?.hue ?? t.green} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.inkMute, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{cat?.label ?? j.category}</div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 15, fontWeight: 700, color: t.ink, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.description}</div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 12.5, color: t.inkMute, marginTop: 4 }}>{isClient ? "con" : "de"} {other}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${t.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ padding: "5px 10px", background: st.bg, color: st.fg, borderRadius: 999, fontFamily: t.fontBody, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase" }}>{st.label}</span>
                  {j.price ? <span style={{ fontFamily: t.fontDisplay, fontSize: 18, fontWeight: 700, color: t.ink, letterSpacing: "-0.01em" }}>{fmtARS(j.price)}</span> : <span style={{ fontFamily: t.fontBody, fontSize: 12.5, color: t.inkSoft }}>Sin cotizar</span>}
                </div>
              </button>
            );
          })}
        </div>

        <TabBar active="jobs" role={isClient ? "client" : "provider"} />
      </div>
    </MobileScreen>
  );
}
