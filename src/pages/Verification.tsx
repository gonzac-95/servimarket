import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { whatsappLink } from "../lib/support";
import { Button, TopBar, toast } from "../components/mobile/kit";
import { Icon } from "../components/mobile/Icon";
import { MobileScreen } from "../components/mobile/MobileScreen";

// ── Tipos ───────────────────────────────────────────
type DocType = "dni" | "background_check" | "license";
type DocStatus = "pending" | "approved" | "rejected";

export interface VerificationDoc {
  id: string;
  provider_id: string;
  document_type: DocType;
  file_url: string; // path dentro del bucket privado verification-documents
  file_name: string | null;
  mime_type: string | null;
  status: DocStatus;
  rejection_reason: string | null;
  uploaded_at: string;
}

const BUCKET = "verification-documents";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

interface DocSpec { type: DocType; title: string; hint: string; required: boolean; }

function specsFor(categories: string[]): DocSpec[] {
  const list: DocSpec[] = [
    { type: "dni", title: "DNI", hint: "Foto del frente y del dorso. Es lo único obligatorio para aparecer en las búsquedas.", required: true },
    { type: "background_check", title: "Certificado de antecedentes", hint: "Opcional. Suma una insignia de confianza en tu perfil. Se tramita online en argentina.gob.ar.", required: false },
  ];
  if (categories.includes("Gasista")) {
    list.push({ type: "license", title: "Matrícula de gasista", hint: "Carnet o credencial de matriculado vigente. Suma la insignia de matrícula verificada.", required: false });
  }
  return list;
}

// Estado agregado de un tipo de documento
function statusOf(docs: VerificationDoc[]): DocStatus | "empty" {
  if (docs.some(d => d.status === "approved")) return "approved";
  if (docs.some(d => d.status === "pending")) return "pending";
  if (docs.some(d => d.status === "rejected")) return "rejected";
  return "empty";
}

// ── Chip de estado ──────────────────────────────────
function StatusPill({ status }: { status: DocStatus | "empty" }) {
  const t = useTheme();
  const map = {
    approved: { bg: t.greenSoft, fg: t.greenDeep, label: "Aprobado" },
    pending: { bg: "rgba(232,168,43,0.14)", fg: "#9B6B12", label: "En revisión" },
    rejected: { bg: "rgba(192,57,43,0.08)", fg: t.danger, label: "Rechazado" },
    empty: { bg: t.surfaceAlt, fg: t.inkMute, label: "Sin cargar" },
  }[status];
  return (
    <span style={{ padding: "4px 10px", background: map.bg, color: map.fg, borderRadius: 999, fontFamily: t.fontBody, fontWeight: 700, fontSize: 11, letterSpacing: "0.02em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {map.label}
    </span>
  );
}

// ── Bloque por tipo de documento ────────────────────
function DocBlock({ spec, docs, providerId, onChange }: { spec: DocSpec; docs: VerificationDoc[]; providerId: string; onChange: () => void }) {
  const t = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const status = statusOf(docs);
  const lastRejected = docs.find(d => d.status === "rejected" && d.rejection_reason);
  const canUpload = status !== "approved";

  async function upload(file: File) {
    if (!ACCEPT.includes(file.type)) { toast("Formato no admitido. Usá JPG, PNG, WEBP o PDF.", "close"); return; }
    if (file.size > MAX_BYTES) { toast("El archivo supera los 5 MB", "close"); return; }
    setBusy(true);
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const path = `${providerId}/${spec.type}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (upErr) { setBusy(false); toast("No se pudo subir el archivo", "close"); return; }
    const { error } = await supabase.from("verification_documents").insert({
      provider_id: providerId, document_type: spec.type, file_url: path, file_name: file.name, mime_type: file.type,
    });
    setBusy(false);
    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      toast("No se pudo registrar el documento", "close");
      return;
    }
    toast("Documento enviado. Lo revisamos a la brevedad.");
    onChange();
  }

  async function view(doc: VerificationDoc) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_url, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
    else toast("No se pudo abrir el archivo", "close");
  }

  async function remove(doc: VerificationDoc) {
    setBusy(true);
    const { error } = await supabase.from("verification_documents").delete().eq("id", doc.id);
    if (!error) await supabase.storage.from(BUCKET).remove([doc.file_url]);
    setBusy(false);
    if (error) { toast("No se pudo eliminar", "close"); return; }
    onChange();
  }

  return (
    <div style={{ background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: t.fontBody, fontSize: 15, fontWeight: 700, color: t.ink }}>{spec.title}</span>
            {spec.required && <span style={{ fontFamily: t.fontBody, fontSize: 11, fontWeight: 700, color: t.inkSoft }}>OBLIGATORIO</span>}
          </div>
          <div style={{ fontFamily: t.fontBody, fontSize: 12.5, color: t.inkMute, marginTop: 4, lineHeight: 1.45 }}>{spec.hint}</div>
        </div>
        <StatusPill status={status} />
      </div>

      {status === "rejected" && lastRejected && (
        <div style={{ padding: 12, borderRadius: t.radiusSm, background: "rgba(192,57,43,0.06)", fontFamily: t.fontBody, fontSize: 12.5, color: t.danger, lineHeight: 1.45 }}>
          <strong>Motivo:</strong> {lastRejected.rejection_reason}. Subí el archivo de nuevo.
        </div>
      )}

      {docs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {docs.map(d => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: t.surfaceAlt, borderRadius: t.radiusSm }}>
              <Icon name={d.mime_type === "application/pdf" ? "paperclip" : "image"} size={16} color={t.inkMute} />
              <button onClick={() => view(d)} style={{ all: "unset", cursor: "pointer", flex: 1, minWidth: 0, fontFamily: t.fontBody, fontSize: 13, color: t.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {d.file_name ?? "Archivo"}
              </button>
              {d.status !== "approved" && (
                <button onClick={() => remove(d)} disabled={busy} aria-label="Eliminar" style={{ all: "unset", cursor: "pointer", display: "flex", padding: 4 }}>
                  <Icon name="close" size={16} color={t.inkMute} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canUpload && (
        <>
          <input ref={inputRef} type="file" accept={ACCEPT.join(",")} style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }} />
          <Button variant={docs.length === 0 ? "green" : "outline"} full disabled={busy} onClick={() => inputRef.current?.click()}
            icon={<Icon name="camera" size={18} color={docs.length === 0 ? "#fff" : t.ink} />}>
            {busy ? "Subiendo..." : docs.length === 0 ? "Subir archivo" : "Agregar otro archivo"}
          </Button>
        </>
      )}
    </div>
  );
}

// ── Página ──────────────────────────────────────────
export default function Verification() {
  const t = useTheme();
  const navigate = useNavigate();
  const { user, provider, refreshUser } = useAuth();
  const [docs, setDocs] = useState<VerificationDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!provider?.id) { setLoading(false); return; }
    const { data } = await supabase.from("verification_documents").select("*")
      .eq("provider_id", provider.id).order("uploaded_at", { ascending: false });
    setDocs((data as VerificationDoc[]) ?? []);
    setLoading(false);
  }, [provider?.id]);

  useEffect(() => { load(); }, [load]);

  // Si el admin aprueba mientras la pantalla está abierta, se refleja al instante
  useEffect(() => {
    if (!provider?.id) return;
    const ch = supabase.channel(`verif:${provider.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "verification_documents", filter: `provider_id=eq.${provider.id}` },
        () => { load(); refreshUser(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [provider?.id, load, refreshUser]);

  if (user && user.role !== "provider") {
    return <MobileScreen width="narrow"><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", background: t.bg, fontFamily: t.fontBody, color: t.inkMute }}>La verificación es sólo para cuentas de prestador.</div></MobileScreen>;
  }

  const specs = specsFor(provider?.categories ?? []);
  const dniStatus = statusOf(docs.filter(d => d.document_type === "dni"));
  const verified = !!provider?.documents_verified;

  const hero = verified
    ? { icon: "check-circle", title: "Identidad verificada", body: "Ya aparecés en las búsquedas y los clientes ven tu insignia de verificado.", color: t.greenBright }
    : dniStatus === "pending"
      ? { icon: "clock", title: "Estamos revisando tu DNI", body: "Suele tomar menos de 48 horas. Te avisamos por notificación cuando esté listo.", color: "#E8A82B" }
      : { icon: "shield", title: "Verificá tu identidad", body: "Para cuidar a los clientes, sólo mostramos prestadores con el DNI verificado. Subilo y empezá a recibir pedidos.", color: t.greenBright };

  return (
    <MobileScreen width="narrow">
      <div style={{ position: "absolute", inset: 0, background: t.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ paddingTop: "calc(var(--sm-top, 54px) - 10px)" }}>
          <TopBar title="Verificación" onBack={() => navigate(-1)} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 40px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* estado general */}
          <div style={{ padding: 20, background: t.surfaceDeep, color: "#fff", borderRadius: t.radiusLg, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, borderRadius: 999, background: `radial-gradient(circle, ${hero.color}55, transparent 70%)` }} />
            <div style={{ position: "relative", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={hero.icon} size={22} color={hero.color} />
              </div>
              <div>
                <div style={{ fontFamily: t.fontDisplay, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>{hero.title}</div>
                <div style={{ fontFamily: t.fontBody, fontSize: 13, opacity: 0.72, marginTop: 6, lineHeight: 1.5 }}>{hero.body}</div>
              </div>
            </div>
          </div>

          {loading || !provider ? (
            <div style={{ padding: "24px 0", textAlign: "center", fontFamily: t.fontBody, color: t.inkMute }}>Cargando...</div>
          ) : specs.map(spec => (
            <DocBlock key={spec.type} spec={spec} providerId={provider.id}
              docs={docs.filter(d => d.document_type === spec.type)} onChange={load} />
          ))}

          <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.inkMute, lineHeight: 1.55, padding: "4px 4px 0" }}>
            Tus documentos se guardan de forma privada: sólo vos y el equipo de ServiMarket pueden verlos, y se usan únicamente para validar tu identidad.
          </div>
          <a href={whatsappLink("Hola ServiMarket, tengo una consulta sobre la verificación de mi cuenta")} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: t.radius, border: `1px solid ${t.line}`, fontFamily: t.fontBody, fontSize: 14, fontWeight: 600, color: t.ink, textDecoration: "none" }}>
            <Icon name="phone" size={16} color={t.green} /> ¿Dudas? Escribinos por WhatsApp
          </a>
          </div>
        </div>
      </div>
    </MobileScreen>
  );
}
