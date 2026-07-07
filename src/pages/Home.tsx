import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useTheme, shade } from "../lib/theme";
import type { Provider } from "../types";
import { CATEGORIES, mapProvider } from "../lib/categories";
import { Avatar, ProviderCard, SectionHeader } from "../components/mobile/kit";
import { Icon, CategoryIcon } from "../components/mobile/Icon";
import { MobileScreen, TabBar } from "../components/mobile/MobileScreen";

export default function Home() {
  const t = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [top, setTop] = useState<Provider[]>([]);
  const [unread, setUnread] = useState(0);

  // Los prestadores tienen su propio panel
  useEffect(() => {
    if (user?.role === "provider") navigate("/provider", { replace: true });
  }, [user?.role, navigate]);

  useEffect(() => {
    const city = user?.city?.trim();
    async function loadTop() {
      // Primero los mejores de la ciudad del usuario; si no hay, los de todo el país
      if (city) {
        const { data } = await supabase.from("providers").select("*, users!inner(id,name,avatar_url,city)")
          .eq("is_available", true).ilike("users.city", city)
          .order("rating_avg", { ascending: false }).order("reviews_count", { ascending: false }).limit(8);
        if (data && data.length > 0) { setTop(data as unknown as Provider[]); return; }
      }
      const { data } = await supabase.from("providers").select("*, users(id,name,avatar_url,city)").eq("is_available", true)
        .order("rating_avg", { ascending: false }).order("reviews_count", { ascending: false }).limit(8);
      setTop((data as Provider[]) ?? []);
    }
    loadTop();
  }, [user?.city]);

  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false)
      .then(({ count }) => setUnread(count ?? 0));
  }, [user]);

  const firstName = (user?.name ?? "").split(" ")[0] || "👋";

  return (
    <MobileScreen>
      <div style={{ position: "absolute", inset: 0, background: t.bg, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* header saludo (con sesión) o invitación a ingresar (invitado) */}
        <div style={{ padding: "54px 20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <>
              <button onClick={() => navigate("/settings")} style={{ all: "unset", cursor: "pointer", display: "flex" }}>
                <Avatar initials={(user.name ?? "U").charAt(0).toUpperCase()} hue={t.green} size={40} src={user.avatar_url} />
              </button>
              <button onClick={() => navigate("/settings")} style={{ all: "unset", cursor: "pointer", flex: 1, minWidth: 0, textAlign: "left" }}>
                <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.inkMute, letterSpacing: "0.04em" }}>Hola {firstName},</div>
                <div style={{ fontFamily: t.fontBody, fontSize: 15, fontWeight: 700, color: t.ink, display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                  <Icon name="pin-fill" size={13} color={t.green} />
                  {user.city || "Argentina"}
                </div>
              </button>
              <button onClick={() => navigate("/notifications")} style={{ all: "unset", cursor: "pointer", position: "relative", width: 42, height: 42, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="bell" size={20} color={t.ink} />
                {unread > 0 && <span style={{ position: "absolute", top: 9, right: 10, width: 8, height: 8, background: t.green, borderRadius: 999, border: `2px solid ${t.surface}` }} />}
              </button>
            </>
          ) : (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.inkMute, letterSpacing: "0.04em" }}>Bienvenido a</div>
                <div style={{ fontFamily: t.fontDisplay, fontSize: 19, fontWeight: 700, color: t.ink, marginTop: 1 }}>
                  Servi<span style={{ color: t.green }}>Market</span>
                </div>
              </div>
              <button onClick={() => navigate("/login")} style={{ all: "unset", cursor: "pointer", padding: "10px 20px", borderRadius: 999, background: t.ink, fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 700, color: "#fff" }}>
                Ingresar
              </button>
            </>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
          {/* hero */}
          <div style={{ padding: "8px 20px 16px" }}>
            <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: 32, fontWeight: 700, color: t.ink, letterSpacing: "-0.025em", lineHeight: 1.05 }}>
              ¿Qué necesitás<br /><span style={{ color: t.green }}>resolver hoy?</span>
            </h1>
          </div>

          {/* search bar */}
          <div style={{ padding: "0 20px 28px" }}>
            <button onClick={() => navigate("/search")} style={{
              all: "unset", cursor: "pointer", width: "100%", boxSizing: "border-box", height: 56,
              background: t.surface, borderRadius: t.radius, border: `1px solid ${t.line}`, boxShadow: t.shadow,
              display: "flex", alignItems: "center", gap: 12, padding: "0 18px",
            }}>
              <Icon name="search" size={20} color={t.inkMute} />
              <span style={{ flex: 1, fontFamily: t.fontBody, fontSize: 14.5, color: t.inkMute }}>Buscar gasista, plomero, ...</span>
            </button>
          </div>

          {/* categorías */}
          <SectionHeader title="Categorías" action="Ver todas" onAction={() => navigate("/search")} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: "0 20px 28px" }}>
            {CATEGORIES.slice(0, 8).map(cat => (
              <button key={cat.id} onClick={() => navigate(`/search?category=${cat.id}`)} style={{ all: "unset", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 60, height: 60, borderRadius: 16, background: t.surface, border: `1px solid ${t.lineSoft}`, boxShadow: t.shadow, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CategoryIcon name={cat.id} size={28} color={cat.hue} />
                </div>
                <div style={{ fontFamily: t.fontBody, fontSize: 11.5, fontWeight: 500, color: t.ink, textAlign: "center", lineHeight: 1.15 }}>{cat.label}</div>
              </button>
            ))}
          </div>

          {/* top calificados */}
          {top.length > 0 && <>
            <SectionHeader title="Top calificados" action="Ver más" onAction={() => navigate("/search")} />
            <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 20px 28px" }} className="scrollbar-hide">
              {top.slice(0, 6).map(p => <ProviderCard key={p.id} provider={mapProvider(p)} onClick={() => navigate(`/provider/${p.id}`)} layout="compact" />)}
            </div>
          </>}

          {/* tip card */}
          <div style={{ padding: "12px 20px 24px" }}>
            <div style={{ background: t.greenSoft, borderRadius: t.radius, padding: 18, display: "flex", gap: 14, alignItems: "flex-start", border: `1px solid ${shade(t.greenSoft, -4)}` }}>
              <div style={{ width: 38, height: 38, borderRadius: 999, background: t.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="shield" size={20} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 14, color: t.ink }}>Cada calificación es real</div>
                <div style={{ fontFamily: t.fontBody, fontSize: 12.5, color: t.inkMute, marginTop: 3, lineHeight: 1.45 }}>
                  Solo podés dejar reseña si pagaste y confirmaste el trabajo dentro de la app.
                </div>
              </div>
            </div>
          </div>
        </div>

        <TabBar active="home" />
      </div>
    </MobileScreen>
  );
}
