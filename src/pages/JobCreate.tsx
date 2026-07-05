import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase, uploadFile, getStorageUrl } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { CATEGORIES, categoryById } from "../lib/categories";
import { Button, Field, Avatar, toast } from "../components/mobile/kit";
import { Icon, CategoryIcon } from "../components/mobile/Icon";
import { MobileScreen } from "../components/mobile/MobileScreen";

const STEPS = ["Categoría", "Detalles", "Cuándo", "Revisar"];

export default function JobCreate() {
  const t = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get("provider");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [catId, setCatId] = useState<string>("");
  const [form, setForm] = useState({ description: "", address: "", scheduledAt: "", price: "" });
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Los pedidos siempre van dirigidos a un prestador: sin ?provider, a buscar uno.
  useEffect(() => {
    if (!providerId) navigate("/search", { replace: true });
  }, [providerId, navigate]);

  useEffect(() => {
    if (providerId) {
      supabase.from("providers").select("*, users(id,name,avatar_url,city)").eq("id", providerId).single().then(({ data }) => {
        setProvider(data);
        // si el prestador tiene una sola categoría del catálogo, se preselecciona
        const matches = CATEGORIES.filter(x => data?.categories?.includes(x.dbName));
        if (matches.length === 1) { setCatId(matches[0].id); setStep(1); }
      });
    }
  }, [providerId]);

  // en el paso de categoría solo se ofrecen las del prestador elegido
  const providerCats = provider
    ? CATEGORIES.filter(c => provider.categories?.includes(c.dbName))
    : [];
  const selectableCats = providerCats.length > 0 ? providerCats : CATEGORIES;

  const cat = categoryById(catId);
  const canNext =
    (step === 0 && !!catId) ||
    (step === 1 && form.description.trim().length > 3) ||
    (step === 2 && form.address.trim().length > 5) ||
    step === 3;

  async function submit() {
    if (!user) { navigate(`/login?redirect=/jobs/new${providerId ? `?provider=${providerId}` : ""}`); return; }
    if (!cat || !providerId) return;
    setLoading(true);
    const { data, error } = await supabase.from("jobs").insert({
      client_id: user.id, provider_id: providerId,
      category: cat.dbName, description: form.description,
      address: form.address, scheduled_at: form.scheduledAt || null,
      price: form.price ? parseFloat(form.price) : null, status: "pending",
      photos,
    }).select().single();
    setLoading(false);
    if (error) { toast("Error al crear el pedido", "shield"); return; }
    toast("¡Pedido publicado!", "check");
    navigate(`/jobs/${data.id}`);
  }

  const next = () => step < STEPS.length - 1 ? setStep(step + 1) : submit();
  const prev = () => step > 0 ? setStep(step - 1) : navigate(-1);

  // Subida de foto del problema (bucket avatars, carpeta jobs/)
  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user || photos.length >= 4) return;
    setUploadingPhoto(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `jobs/${user.id}_${Date.now()}.${ext}`;
    const uploaded = await uploadFile("avatars", path, file);
    setUploadingPhoto(false);
    if (uploaded) setPhotos(p => [...p, getStorageUrl("avatars", uploaded)]);
    else toast("No se pudo subir la foto", "shield");
  }

  const H = ({ children }: { children: React.ReactNode }) => (
    <h2 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: 30, fontWeight: 700, color: t.ink, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{children}</h2>
  );
  const Sub = ({ children }: { children: React.ReactNode }) => (
    <p style={{ marginTop: 8, fontFamily: t.fontBody, fontSize: 14, color: t.inkMute }}>{children}</p>
  );

  return (
    <MobileScreen>
      <div style={{ position: "absolute", inset: 0, background: t.bg, zIndex: 40, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "54px 16px 0", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={prev} style={{ all: "unset", cursor: "pointer", width: 40, height: 40, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={step === 0 ? "close" : "arrow-left"} size={20} color={t.ink} />
          </button>
          <div style={{ flex: 1, fontFamily: t.fontBody, fontSize: 12, color: t.inkMute, textAlign: "center" }}>
            Paso <strong style={{ color: t.ink }}>{step + 1}</strong> de {STEPS.length} · {STEPS[step]}
          </div>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ height: 5, background: t.surfaceAlt, borderRadius: 99 }}>
            <div style={{ width: `${((step + 1) / STEPS.length) * 100}%`, height: "100%", background: t.green, borderRadius: 99, transition: "width .25s" }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
          {provider && step > 0 && (
            <div style={{ marginBottom: 18, padding: 12, background: t.greenSoft, borderRadius: t.radiusSm, display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar initials={provider.users?.name?.charAt(0).toUpperCase() ?? "P"} hue={t.green} size={34} />
              <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.greenDeep }}>Pedido dirigido a <strong>{provider.users?.name}</strong></div>
            </div>
          )}

          {step === 0 && (
            <>
              <H>¿Qué servicio<br />necesitás?</H>
              <Sub>Elegí una categoría.</Sub>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 22 }}>
                {selectableCats.map(c => {
                  const on = catId === c.id;
                  return (
                    <button key={c.id} onClick={() => setCatId(c.id)} style={{
                      all: "unset", cursor: "pointer", padding: 14, background: on ? t.ink : t.surface,
                      border: `1.5px solid ${on ? t.ink : t.lineSoft}`, borderRadius: t.radius,
                      display: "flex", flexDirection: "column", gap: 14, boxShadow: on ? "0 8px 24px -10px rgba(0,0,0,0.30)" : t.shadow,
                    }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: on ? "rgba(255,255,255,0.10)" : `${c.hue}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CategoryIcon name={c.id} size={24} color={on ? "#fff" : c.hue} />
                      </div>
                      <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 14.5, color: on ? "#fff" : t.ink }}>{c.label}</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <H>Contanos<br />el trabajo</H>
              <Sub>Cuanto más claro, mejor cotización vas a recibir.</Sub>
              <div style={{ marginTop: 22 }}>
                <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 600, color: t.inkMute, marginBottom: 6, letterSpacing: "0.02em", textTransform: "uppercase" }}>Descripción</div>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Contá qué necesitás, equipo que tenés, espacio, etc."
                  style={{ width: "100%", minHeight: 140, boxSizing: "border-box", resize: "none", padding: "12px 14px", background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radiusSm, fontFamily: t.fontBody, fontSize: 14.5, color: t.ink, outline: "none" }} />
              </div>

              {/* fotos del problema (opcional) */}
              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 600, color: t.inkMute, marginBottom: 6, letterSpacing: "0.02em", textTransform: "uppercase" }}>Fotos (opcional)</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {photos.map(url => (
                    <div key={url} style={{ position: "relative", width: 72, height: 72 }}>
                      <img src={url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12, border: `1px solid ${t.line}` }} />
                      <button onClick={() => setPhotos(p => p.filter(u => u !== url))} style={{ all: "unset", cursor: "pointer", position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 999, background: t.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="close" size={12} color="#fff" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 4 && (
                    <label style={{ width: 72, height: 72, borderRadius: 12, border: `1.5px dashed ${t.line}`, background: t.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      {uploadingPhoto
                        ? <span style={{ fontFamily: t.fontBody, fontSize: 11, color: t.inkMute }}>...</span>
                        : <Icon name="plus" size={22} color={t.inkSoft} stroke={2} />}
                      <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} disabled={uploadingPhoto} />
                    </label>
                  )}
                </div>
                <div style={{ marginTop: 6, fontFamily: t.fontBody, fontSize: 11.5, color: t.inkSoft }}>Una buena foto ayuda a cotizar mejor. Hasta 4.</div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <H>¿Dónde y cuándo?</H>
              <Sub>Solo el prestador asignado verá la dirección exacta.</Sub>
              <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Dirección" value={form.address} onChange={(v: string) => setForm(f => ({ ...f, address: v }))} placeholder="Calle 123, Barrio, Ciudad" />
                <div>
                  <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 600, color: t.inkMute, marginBottom: 6, letterSpacing: "0.02em", textTransform: "uppercase" }}>Fecha (opcional)</div>
                  <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", height: 46, padding: "0 14px", background: t.surface, border: `1px solid ${t.line}`, borderRadius: t.radiusSm, fontFamily: t.fontBody, fontSize: 14, color: t.ink, outline: "none" }} />
                </div>
                <Field label="Presupuesto máximo (opcional)" value={form.price} onChange={(v: string) => setForm(f => ({ ...f, price: v }))} placeholder="0" type="number" />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <H>Revisá y enviá</H>
              <Sub>{provider?.users?.name ? `Tu pedido le llega directo a ${provider.users.name}.` : "Tu pedido le llega directo al prestador."}</Sub>
              <div style={{ marginTop: 22, background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  ["Categoría", cat?.label ?? "—"],
                  ["Descripción", form.description || "—"],
                  ["Dirección", form.address],
                  ["Cuándo", form.scheduledAt ? new Date(form.scheduledAt).toLocaleString("es-AR") : "Flexible"],
                  ["Presupuesto", form.price ? `$${Number(form.price).toLocaleString("es-AR")}` : "A cotizar"],
                  ["Fotos", photos.length > 0 ? `${photos.length}` : "Sin fotos"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontFamily: t.fontBody, fontSize: 11.5, color: t.inkMute, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{k}</span>
                    <span style={{ fontFamily: t.fontBody, fontSize: 14, color: t.ink, fontWeight: 600, textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: 16, background: t.greenSoft, borderRadius: t.radiusSm, display: "flex", gap: 12 }}>
                <Icon name="shield" size={20} color={t.green} />
                <div style={{ fontFamily: t.fontBody, fontSize: 12.5, color: t.greenDeep, lineHeight: 1.5 }}>
                  <strong>Sin compromiso.</strong> El prestador te responde con una cotización; si te cierra la aceptás y pagás por la app cuando el trabajo esté hecho.
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: "14px 20px 30px", background: t.bg, borderTop: `1px solid ${t.lineSoft}` }}>
          <Button variant="green" size="lg" full onClick={next} disabled={!canNext || loading}
            iconRight={step < STEPS.length - 1 ? <Icon name="arrow-right" size={18} color="#fff" /> : undefined}>
            {loading ? "Publicando..." : step < STEPS.length - 1 ? "Continuar" : "Publicar pedido"}
          </Button>
        </div>
      </div>
    </MobileScreen>
  );
}
