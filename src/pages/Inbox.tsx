import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { categoryByDbName } from "../lib/categories";
import { Avatar } from "../components/mobile/kit";
import { Icon } from "../components/mobile/Icon";
import { MobileScreen, TabBar } from "../components/mobile/MobileScreen";

interface Conversation {
  jobId: string;
  otherName: string;
  otherAvatar?: string | null;
  category: string;
  lastText: string;
  lastAt: string;
  lastMine: boolean;
  unread: number;
}

// Hora si es de hoy, "Ayer", o fecha corta — como cualquier app de mensajes.
function whenLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export default function Inbox() {
  const t = useTheme();
  const navigate = useNavigate();
  const { user, provider } = useAuth();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const isProvider = user?.role === "provider";

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      // 1) Trabajos donde participo (según rol)
      let jq = supabase.from("jobs")
        .select("id, category, client_id, clients:users!jobs_client_id_fkey(id,name,avatar_url), providers(id, users(id,name,avatar_url))");
      if (isProvider) {
        if (!provider?.id) { setLoading(false); return; }
        jq = jq.eq("provider_id", provider.id);
      } else {
        jq = jq.eq("client_id", user!.id);
      }
      const { data: jobs } = await jq;
      const ids = (jobs ?? []).map((j: any) => j.id);
      if (ids.length === 0) { if (!cancelled) { setConvs([]); setLoading(false); } return; }

      // 2) Mensajes de esos trabajos, más nuevo primero
      const { data: msgs } = await supabase.from("messages")
        .select("id, job_id, sender_id, text, read, created_at")
        .in("job_id", ids)
        .order("created_at", { ascending: false })
        .limit(500);

      // 3) Una conversación por trabajo: último mensaje + no leídos míos
      const byJob = new Map<string, Conversation>();
      (msgs ?? []).forEach((m: any) => {
        const job: any = (jobs ?? []).find((j: any) => j.id === m.job_id);
        if (!job) return;
        const other = isProvider ? job.clients : job.providers?.users;
        let c = byJob.get(m.job_id);
        if (!c) {
          c = {
            jobId: m.job_id,
            otherName: other?.name ?? (isProvider ? "Cliente" : "Prestador"),
            otherAvatar: other?.avatar_url,
            category: categoryByDbName(job.category)?.label ?? job.category,
            lastText: m.text,
            lastAt: m.created_at,
            lastMine: m.sender_id === user!.id,
            unread: 0,
          };
          byJob.set(m.job_id, c);
        }
        if (!m.read && m.sender_id !== user!.id) c.unread += 1;
      });

      if (!cancelled) {
        setConvs([...byJob.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt)));
        setLoading(false);
      }
    }

    load();
    // Un mensaje nuevo en cualquier trabajo refresca la bandeja
    const sub = supabase.channel("inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(sub); };
  }, [user, provider?.id, isProvider]);

  return (
    <MobileScreen>
      <div style={{ position: "absolute", inset: 0, background: t.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "54px 20px 12px" }}>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: 32, fontWeight: 700, color: t.ink, letterSpacing: "-0.02em" }}>Bandeja</h1>
          <div style={{ marginTop: 4, fontFamily: t.fontBody, fontSize: 13, color: t.inkMute }}>
            Tus conversaciones con {isProvider ? "clientes" : "prestadores"}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 100px", display: "flex", flexDirection: "column", gap: 8 }}>
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", fontFamily: t.fontBody, color: t.inkMute }}>Cargando...</div>
          ) : convs.length === 0 ? (
            <div style={{ padding: "70px 20px", textAlign: "center" }}>
              <Icon name="chat" size={40} color={t.line} />
              <div style={{ marginTop: 12, fontFamily: t.fontBody, fontSize: 14.5, fontWeight: 700, color: t.ink }}>Todavía no hay mensajes</div>
              <div style={{ marginTop: 6, fontFamily: t.fontBody, fontSize: 13, color: t.inkMute, lineHeight: 1.5 }}>
                {isProvider
                  ? "Cuando un cliente te escriba por un trabajo, la conversación aparece acá."
                  : "Cuando le escribas a un prestador, la conversación aparece acá."}
              </div>
            </div>
          ) : convs.map(c => (
            <button key={c.jobId} onClick={() => navigate(`/jobs/${c.jobId}`)} style={{
              all: "unset", cursor: "pointer", boxSizing: "border-box", width: "100%",
              display: "flex", alignItems: "center", gap: 12, padding: 14,
              background: t.surface, border: `1px solid ${c.unread > 0 ? t.greenSoft : t.lineSoft}`, borderRadius: t.radius,
            }}>
              <Avatar initials={c.otherName.charAt(0).toUpperCase()} hue={t.green} size={46} src={c.otherAvatar} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ flex: 1, minWidth: 0, fontFamily: t.fontBody, fontSize: 14.5, fontWeight: 700, color: t.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.otherName}</span>
                  <span style={{ fontFamily: t.fontBody, fontSize: 11, color: c.unread > 0 ? t.green : t.inkSoft, fontWeight: c.unread > 0 ? 700 : 500, flexShrink: 0 }}>{whenLabel(c.lastAt)}</span>
                </div>
                <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.inkMute, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginTop: 1 }}>{c.category}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                  <span style={{
                    flex: 1, minWidth: 0, fontFamily: t.fontBody, fontSize: 13,
                    color: c.unread > 0 ? t.ink : t.inkMute, fontWeight: c.unread > 0 ? 600 : 400,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {c.lastMine && <span style={{ color: t.inkSoft }}>Vos: </span>}{c.lastText}
                  </span>
                  {c.unread > 0 && (
                    <span style={{ flexShrink: 0, minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999, background: t.green, color: "#fff", fontFamily: t.fontBody, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <TabBar active="inbox" role={isProvider ? "provider" : "client"} />
      </div>
    </MobileScreen>
  );
}
