import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { toast } from "../components/mobile/kit";
import { Icon } from "../components/mobile/Icon";
import { TopBar } from "../components/mobile/kit";
import { MobileScreen } from "../components/mobile/MobileScreen";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Notif {
  id: string; title: string; body: string; type?: string;
  read: boolean; created_at: string; data?: Record<string, unknown>;
}

// Mapea el `type` de la notificación a un ícono + color
function iconFor(type: string | undefined, t: ReturnType<typeof useTheme>) {
  switch (type) {
    case "message": return { icon: "chat", bg: "rgba(43,143,224,0.12)", color: "#1B5C97" };
    case "quote": return { icon: "wallet", bg: t.greenSoft, color: t.green };
    case "job_new":
    case "job_accepted":
    case "job_progress":
    case "job_done":
    case "job_completed":
    case "job_cancelled": return { icon: "briefcase", bg: "rgba(232,168,43,0.14)", color: "#9B6B12" };
    case "review": return { icon: "star", bg: "rgba(232,168,43,0.14)", color: t.star };
    default: return { icon: "shield", bg: t.surfaceAlt, color: t.inkMute };
  }
}

function isToday(iso: string) {
  const d = new Date(iso), n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

export default function Notifications() {
  const t = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(40);
    setItems((data as Notif[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function markAll() {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id);
    setItems(list => list.map(n => ({ ...n, read: true })));
    toast("Todo marcado como leído", "check");
  }

  function open(n: Notif) {
    const jobId = n.data?.job_id as string | undefined;
    if (jobId) navigate(`/jobs/${jobId}`);
  }

  const today = items.filter(n => isToday(n.created_at));
  const earlier = items.filter(n => !isToday(n.created_at));

  const Row = ({ n }: { n: Notif }) => {
    const m = iconFor(n.type, t);
    return (
      <button onClick={() => open(n)} style={{ all: "unset", cursor: "pointer", width: "100%", boxSizing: "border-box", display: "flex", gap: 12, padding: "12px 4px", position: "relative" }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={m.icon} size={20} color={m.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: t.fontBody, fontSize: 14, color: t.ink, lineHeight: 1.4 }}>
            <strong>{n.title}</strong> · {n.body}
          </div>
          <div style={{ fontFamily: t.fontBody, fontSize: 11.5, color: t.inkSoft, marginTop: 2 }}>
            {formatDistanceToNow(new Date(n.created_at), { locale: es, addSuffix: true })}
          </div>
        </div>
        {!n.read && <div style={{ width: 8, height: 8, borderRadius: 999, background: t.green, alignSelf: "center", flexShrink: 0 }} />}
      </button>
    );
  };

  const Label = ({ children }: { children: string }) => (
    <div style={{ fontFamily: t.fontBody, fontSize: 11, fontWeight: 700, color: t.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", padding: "14px 4px 8px" }}>{children}</div>
  );

  return (
    <MobileScreen>
      <div style={{ position: "absolute", inset: 0, background: t.bg, display: "flex", flexDirection: "column" }}>
        <TopBar title="Notificaciones" onBack={() => navigate(-1)} right={
          items.some(n => !n.read)
            ? <button onClick={markAll} style={{ all: "unset", cursor: "pointer", fontFamily: t.fontBody, fontSize: 13, fontWeight: 600, color: t.green }}>Marcar leídas</button>
            : undefined
        } />
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px" }}>
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", fontFamily: t.fontBody, color: t.inkMute }}>Cargando...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: "80px 0", textAlign: "center", fontFamily: t.fontBody, color: t.inkMute }}>
              <div style={{ fontSize: 40 }}>🔔</div>
              <div style={{ marginTop: 8 }}>No tenés notificaciones todavía.</div>
            </div>
          ) : (
            <>
              {today.length > 0 && <Label>Hoy</Label>}
              {today.map(n => <Row key={n.id} n={n} />)}
              {earlier.length > 0 && <Label>Anteriores</Label>}
              {earlier.map(n => <Row key={n.id} n={n} />)}
            </>
          )}
        </div>
      </div>
    </MobileScreen>
  );
}
