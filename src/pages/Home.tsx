import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { usePaymentsEnabled } from "../lib/features";
import { useIsDesktop } from "../lib/useIsDesktop";
import { useAuth } from "../lib/auth";
import { useTheme, shade } from "../lib/theme";
import type { Provider } from "../types";
import { CATEGORIES, mapProvider } from "../lib/categories";
import { Avatar, ProviderCard, SectionHeader } from "../components/mobile/kit";
import { Icon, CategoryIcon } from "../components/mobile/Icon";
import { MobileScreen, TabBar } from "../components/mobile/MobileScreen";

export default function Home() {
  const t = useTheme();
  const { enabled: paymentsEnabled } = usePaymentsEnabled();
  const desktop = useIsDesktop();
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
          .eq("is_available", true).eq("documents_verified", true).ilike("users.city", city)
          .order("rating_avg", { ascending: false }).order("reviews_count", { ascending: false }).limit(8);
        if (data && data.length > 0) { setTop(data as unknown as Provider[]); return; }
      }
      const { data } = await supabase.from("providers").select("*, users(id,name,avatar_url,city)").eq("is_available", true).eq("documents_verified", true)
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
        {/* header saludo (con sesión) o invitación a ingresar (invitado). En escritorio lo reemplaza la barra superior */}
        {!desktop && <div style={{ padding: "var(--sm-top, 54px) 20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
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
        </div>}

        <div style={{ flex: 1, overflowY: "auto", paddingBottom: desktop ? 48 : 100, paddingTop: desktop ? 40 : 0 }}>
          {/* hero */}
          <div style={{ padding: "8px 20px 16px" }}>
            <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: desktop ? 52 : 32, fontWeight: 700, color: t.ink, letterSpacing: "-0.025em", lineHeight: 1.05 }}>
              ¿Qué necesitás<br /><span style={{ color: t.green }}>resolver hoy?</span>
            </h1>
          </div>

          {/* search bar */}
          <div style={{ padding: desktop ? "12px 20px 40px" : "0 20px 28px", maxWidth: desktop ? 680 : undefined }}>
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
          <div style={{ display: "grid", gridTemplateColumns: desktop ? "repeat(auto-fill, minmax(96px, 1fr))" : "repeat(4, 1fr)", gap: desktop ? 16 : 12, padding: desktop ? "0 20px 40px" : "0 20px 28px" }}>
            {(desktop ? CATEGORIES : CATEGORIES.slice(0, 8)).map(cat => (
              <button key={cat.id} onClick={() => navigate(`/search?category=${cat.id}`)} style={{ all: "unset", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 60, height: 60, borderRadius: 16, background: t.surface, border: `1px solid ${t.lineSoft}`, boxShadow: t.shadow, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CategoryIcon name={cat.id} size={28} color={cat.hue} />
                </div>
                <div style={{ fontFamily: t.fontBody, fontSize: 11.5, fontWeight: 500, color: t.ink, textAlign: "center", lineHeight: 1.15 }}>{cat.label}</div>
              </button>
            ))}
          </div>

          {/* sumate como prestador (invitados) */}
          {!user && (
            <div style={{ padding: desktop ? "0 20px 40px" : "0 20px 28px" }}>
              <div style={{ position: "relative", overflow: "hidden", background: t.surfaceDeep, borderRadius: t.radiusLg, padding: desktop ? "28px 32px" : 20, color: "#fff", display: "flex", flexDirection: desktop ? "row" : "column", alignItems: desktop ? "center" : "flex-start", gap: desktop ? 24 : 14 }}>
                <div style={{ position: "absolute", right: -60, top: -60, width: 220, height: 220, borderRadius: 999, background: `radial-gradient(circle, ${t.greenBright}55, transparent 70%)` }} />
                <div style={{ position: "relative", flex: 1 }}>
                  <div style={{ fontFamily: t.fontDisplay, fontSize: desktop ? 24 : 20, fontWeight: 700, letterSpacing: "-0.02em" }}>¿Ofrecés servicios para el hogar?</div>
                  <div style={{ fontFamily: t.fontBody, fontSize: 13.5, opacity: 0.72, marginTop: 6, lineHeight: 1.5 }}>Sumate gratis, verificá tu identidad y empezá a recibir pedidos de clientes de tu zona.</div>
                </div>
                <button onClick={() => navigate("/register?role=provider")} style={{ all: "unset", cursor: "pointer", position: "relative", padding: "12px 20px", borderRadius: 999, background: t.greenBright, fontFamily: t.fontBody, fontSize: 14, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
                  Registrarme como prestador
                </button>
              </div>
            </div>
          )}

          {/* top calificados */}
          {top.length > 0 && <>
            <SectionHeader title="Top calificados" action="Ver más" onAction={() => navigate("/search")} />
            <div style={desktop
              ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, padding: "0 20px 36px" }
              : { display: "flex", gap: 12, overflowX: "auto", padding: "0 20px 28px" }} className="scrollbar-hide">
              {top.slice(0, desktop ? 8 : 6).map(p => <ProviderCard key={p.id} provider={mapProvider(p)} onClick={() => navigate(`/provider/${p.id}`)} layout="compact" fluid={desktop} />)}
            </div>
          </>}

          {/* tip card */}
          <div style={{ padding: "12px 20px 24px", maxWidth: desktop ? 680 : undefined }}>
            <div style={{ background: t.greenSoft, borderRadius: t.radius, padding: 18, display: "flex", gap: 14, alignItems: "flex-start", border: `1px solid ${shade(t.greenSoft, -4)}` }}>
              <div style={{ width: 38, height: 38, borderRadius: 999, background: t.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="shield" size={20} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 14, color: t.ink }}>Cada calificación es real</div>
                <div style={{ fontFamily: t.fontBody, fontSize: 12.5, color: t.inkMute, marginTop: 3, lineHeight: 1.45 }}>
                  {paymentsEnabled
                    ? "Solo podés dejar reseña si pagaste y confirmaste el trabajo dentro de la app."
                    : "Solo se puede reseñar un trabajo pedido por ServiMarket y confirmado por las dos partes. Y todos los prestadores tienen el DNI verificado."}
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
