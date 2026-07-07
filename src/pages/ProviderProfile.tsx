import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useFavorites } from "../hooks/useFavorites";
import { useTheme, shade, fmtARS } from "../lib/theme";
import { categoryByDbName } from "../lib/categories";
import { Avatar, Button, Tag, TopBar, toast } from "../components/mobile/kit";
import { Icon } from "../components/mobile/Icon";
import { MobileScreen } from "../components/mobile/MobileScreen";

function Stat({ label, value, sub, icon }: { label: string; value: string | number; sub: string; icon?: string }) {
  const t = useTheme();
  return (
    <div style={{ padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: t.radiusSm }}>
      <div style={{ fontFamily: t.fontBody, fontSize: 10.5, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
        {icon && <Icon name={icon} size={16} color={t.star} />}
        <span style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</span>
      </div>
      <div style={{ fontFamily: t.fontBody, fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function InfoRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  const t = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: last ? "none" : `1px solid ${t.lineSoft}` }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: t.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={16} color={t.inkMute} />
      </div>
      <div style={{ flex: 1, fontFamily: t.fontBody, fontSize: 13, color: t.inkMute }}>{label}</div>
      <div style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 600, color: t.ink }}>{value}</div>
    </div>
  );
}

export default function ProviderProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = useTheme();
  const [provider, setProvider] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"about" | "reviews" | "work">("about");
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from("providers").select("*, users(id,name,avatar_url,city)").eq("id", id).single();
      setProvider(p);
      const { data: r } = await supabase.from("reviews").select("*, clients:users!reviews_client_id_fkey(id,name,avatar_url)").eq("provider_id", id).order("created_at", { ascending: false }).limit(20);
      setReviews(r ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <MobileScreen><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: t.bg, fontFamily: t.fontBody, color: t.inkMute }}>Cargando...</div></MobileScreen>;
  if (!provider) return <MobileScreen><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: t.bg, fontFamily: t.fontBody, color: t.inkMute }}>Prestador no encontrado</div></MobileScreen>;

  const u = provider.users;
  const name = u?.name ?? "Prestador";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const hue = (provider.categories?.[0] && categoryByDbName(provider.categories[0])?.hue) || t.green;
  const catLabel = provider.categories?.[0] ? (categoryByDbName(provider.categories[0])?.label ?? provider.categories[0]) : "Servicio";
  const isNew = (provider.reviews_count ?? 0) === 0;
  const fav = isFavorite(provider.id);
  const photos: string[] = provider.photos ?? [];
  const prices = provider.price_list ?? [];

  // distribución de estrellas
  const dist = [5, 4, 3, 2, 1].map(n => {
    const c = reviews.filter(r => r.rating === n).length;
    return { n, pct: reviews.length ? Math.round((c / reviews.length) * 100) : 0 };
  });

  function requestQuote() {
    // Invitado: acá recién se le pide crear cuenta, y vuelve directo al pedido
    if (!user) {
      toast("Creá tu cuenta para contactar al prestador", "user");
      navigate(`/login?redirect=${encodeURIComponent(`/jobs/new?provider=${id}`)}`);
      return;
    }
    if (user.role !== "client") { toast("Los prestadores no pueden pedir presupuestos", "close"); return; }
    navigate(`/jobs/new?provider=${id}`);
  }

  function handleFavorite() {
    if (!user) {
      toast("Ingresá para guardar favoritos", "heart-fill");
      navigate(`/login?redirect=${encodeURIComponent(`/provider/${id}`)}`);
      return;
    }
    toggleFavorite(provider.id);
    toast(fav ? "Quitado de favoritos" : "Guardado en favoritos", "heart-fill");
  }

  return (
    <MobileScreen>
      <div style={{ position: "absolute", inset: 0, background: t.bg, display: "flex", flexDirection: "column" }}>
        {/* hero */}
        <div style={{ background: t.surfaceDeep, padding: "54px 16px 28px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -60, top: -40, width: 220, height: 220, borderRadius: 999, background: `radial-gradient(circle, ${shade(hue, 10)}55, transparent 70%)` }} />
          <TopBar title="" onBack={() => navigate(-1)} transparent dark right={
            <button onClick={handleFavorite} style={{ all: "unset", cursor: "pointer", width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={fav ? "heart-fill" : "heart"} size={18} color={fav ? "#FF5A5A" : "#fff"} />
            </button>
          } />
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginTop: 12, position: "relative" }}>
            <Avatar initials={initials} hue={hue} size={84} ring src={u?.avatar_url} />
            <div style={{ flex: 1, color: "#fff", paddingBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: 26, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.1 }}>{name}</h1>
                {provider.documents_verified && <Icon name="check-circle" size={18} color={t.greenBright} />}
              </div>
              <div style={{ fontFamily: t.fontBody, fontSize: 13.5, opacity: 0.7, marginTop: 4 }}>{catLabel}</div>
            </div>
          </div>
          {isNew && (
            <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: t.greenBright, borderRadius: 999, fontFamily: t.fontBody, fontSize: 12, fontWeight: 700, color: "#fff" }}>
              <Icon name="badge" size={14} color="#fff" /> Nuevo en ServiMarket
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 22 }}>
            <Stat label="Rating" value={isNew ? "—" : provider.rating_avg.toFixed(1)} sub={`${provider.reviews_count} reseñas`} icon={isNew ? undefined : "star"} />
            <Stat label="Verificado" value={provider.documents_verified ? "Sí" : "No"} sub="documentos" />
            <Stat label="Zona" value={`${provider.service_radius_km}`} sub="km de radio" />
          </div>
        </div>

        {/* tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${t.lineSoft}`, padding: "0 20px", background: t.bg }}>
          {([{ id: "about", label: "Sobre" }, { id: "reviews", label: "Reseñas" }, { id: "work", label: "Trabajos" }] as const).map(o => (
            <button key={o.id} onClick={() => setTab(o.id)} style={{ all: "unset", cursor: "pointer", padding: "14px 16px", position: "relative", fontFamily: t.fontBody, fontSize: 14, fontWeight: tab === o.id ? 700 : 500, color: tab === o.id ? t.ink : t.inkMute }}>
              {o.label}
              {tab === o.id && <div style={{ position: "absolute", left: 14, right: 14, bottom: 0, height: 2.5, background: t.ink, borderRadius: 3 }} />}
            </button>
          ))}
        </div>

        {/* contenido */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 110 }}>
          {tab === "about" && (
            <div style={{ padding: "20px 20px 24px" }}>
              {provider.bio && <p style={{ margin: 0, fontFamily: t.fontBody, fontSize: 14.5, color: t.ink, lineHeight: 1.55 }}>{provider.bio}</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                {(provider.categories ?? []).map((c: string) => <Tag key={c} tone="green">{categoryByDbName(c)?.label ?? c}</Tag>)}
              </div>
              {prices.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 700, color: t.inkMute, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Lista de precios</div>
                  <div style={{ background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius, overflow: "hidden" }}>
                    {prices.map((item: any, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: i < prices.length - 1 ? `1px solid ${t.lineSoft}` : "none" }}>
                        <span style={{ fontFamily: t.fontBody, fontSize: 14, color: t.ink }}>{item.service}</span>
                        <span style={{ fontFamily: t.fontBody, fontSize: 13.5, fontWeight: 700, color: item.price === 0 ? t.inkSoft : t.green }}>{item.price === 0 ? "A presupuestar" : `${fmtARS(item.price)} / ${item.unit}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 700, color: t.inkMute, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Información</div>
                <div style={{ background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius, overflow: "hidden" }}>
                  <InfoRow icon="pin" label="Zona" value={u?.city ? `${u.city}` : "Argentina"} />
                  <InfoRow icon="shield" label="Radio de servicio" value={`${provider.service_radius_km} km`} />
                  <InfoRow icon="calendar" label="Disponibilidad" value={provider.is_available ? "Disponible" : "No disponible"} last />
                </div>
              </div>
            </div>
          )}

          {tab === "reviews" && (
            <div style={{ padding: "20px 20px 24px" }}>
              {isNew ? (
                <div style={{ padding: "50px 0", textAlign: "center", fontFamily: t.fontBody, color: t.inkMute }}>
                  <Icon name="star-outline" size={36} color={t.line} />
                  <div style={{ marginTop: 10 }}>Todavía no tiene reseñas.</div>
                </div>
              ) : <>
                <div style={{ display: "flex", gap: 20, padding: "18px", background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius }}>
                  <div>
                    <div style={{ fontFamily: t.fontDisplay, fontSize: 44, fontWeight: 700, color: t.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>{provider.rating_avg.toFixed(1)}</div>
                    <div style={{ display: "flex", gap: 1, marginTop: 6 }}>{[1, 2, 3, 4, 5].map(n => <Icon key={n} name="star" size={14} color={n <= Math.round(provider.rating_avg) ? t.star : t.line} />)}</div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 11.5, color: t.inkMute, marginTop: 6 }}>{provider.reviews_count} reseñas</div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, justifyContent: "center" }}>
                    {dist.map(r => (
                      <div key={r.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: t.fontBody, fontSize: 11, color: t.inkMute, width: 8 }}>{r.n}</span>
                        <div style={{ flex: 1, height: 6, background: t.surfaceAlt, borderRadius: 99 }}><div style={{ height: "100%", width: `${r.pct}%`, background: t.green, borderRadius: 99 }} /></div>
                        <span style={{ fontFamily: t.fontMono, fontSize: 10.5, color: t.inkSoft, width: 30, textAlign: "right" }}>{r.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ padding: 16, background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar initials={(r.clients?.name ?? "?").charAt(0).toUpperCase()} hue={t.inkMute} size={34} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 13.5, color: t.ink }}>{r.clients?.name ?? "Cliente"}</div>
                          <div style={{ fontFamily: t.fontBody, fontSize: 11.5, color: t.inkSoft }}>{new Date(r.created_at).toLocaleDateString("es-AR")}</div>
                        </div>
                        <div style={{ display: "flex", gap: 1 }}>{[1, 2, 3, 4, 5].map(n => <Icon key={n} name="star" size={12} color={n <= r.rating ? t.star : t.line} />)}</div>
                      </div>
                      {r.comment && <p style={{ margin: "10px 0 0", fontFamily: t.fontBody, fontSize: 13.5, color: t.ink, lineHeight: 1.5 }}>{r.comment}</p>}
                      {r.reply && (
                        <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: `2px solid ${t.greenSoft}` }}>
                          <div style={{ fontFamily: t.fontBody, fontSize: 11.5, fontWeight: 700, color: t.green, marginBottom: 2 }}>Respuesta del prestador</div>
                          <p style={{ margin: 0, fontFamily: t.fontBody, fontSize: 13, color: t.inkMute }}>{r.reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>}
            </div>
          )}

          {tab === "work" && (
            photos.length > 0 ? (
              <div style={{ padding: "20px 20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {photos.map((url, i) => <img key={i} src={url} alt="" style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: t.radiusSm }} />)}
              </div>
            ) : (
              <div style={{ padding: "50px 0", textAlign: "center", fontFamily: t.fontBody, color: t.inkMute }}>
                <Icon name="image" size={36} color={t.line} />
                <div style={{ marginTop: 10 }}>Todavía no subió fotos de trabajos.</div>
              </div>
            )
          )}
        </div>

        {/* action bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px 30px", background: t.surface, borderTop: `1px solid ${t.lineSoft}`, display: "flex", gap: 10, boxShadow: "0 -8px 30px rgba(0,0,0,0.04)" }}>
          <Button variant="outline" size="lg" onClick={requestQuote} icon={<Icon name="chat" size={18} color={t.ink} />}>Chatear</Button>
          <Button variant="green" size="lg" full onClick={requestQuote} icon={<Icon name="plus" size={18} color="#fff" stroke={2.4} />}>Pedir presupuesto</Button>
        </div>
      </div>
    </MobileScreen>
  );
}
