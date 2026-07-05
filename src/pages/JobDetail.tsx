import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import type { Job, Message, Payment } from "../types";
import { calculateCommission, useCommissionTiers } from "../lib/commission";
import { useTheme, fmtARS } from "../lib/theme";
import { categoryByDbName } from "../lib/categories";
import { Avatar, Button, Field, toast } from "../components/mobile/kit";
import { Icon, CategoryIcon } from "../components/mobile/Icon";
import { MobileScreen } from "../components/mobile/MobileScreen";
import { format } from "date-fns";

// ── Comisión: desglose para prestador/cliente ──
function CommissionBreakdown({ amount, role }: { amount: number; role: "provider" | "client" }) {
  const t = useTheme();
  const { tiers } = useCommissionTiers();
  const b = calculateCommission(amount, tiers);
  if (b.amount <= 0) return null;
  const isProvider = role === "provider";
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: t.fontBody, fontSize: 13.5 }}>
        <span style={{ color: t.inkMute }}>Total del trabajo</span><span style={{ color: t.ink, fontWeight: 600 }}>{fmtARS(b.amount)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: t.fontBody, fontSize: 13.5 }}>
        <span style={{ color: t.inkMute }}>Comisión ServiMarket</span><span style={{ color: t.inkMute }}>- {fmtARS(b.fee)}</span>
      </div>
      <div style={{ height: 1, background: t.line, margin: "2px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: t.fontBody, fontSize: 14, fontWeight: 700, color: t.ink }}>{isProvider ? "Recibís" : "El prestador recibe"}</span>
        <span style={{ fontFamily: t.fontDisplay, fontSize: 20, fontWeight: 700, color: t.green }}>{fmtARS(b.providerNet)}</span>
      </div>
    </div>
  );
}

// ── Sección de pago (create-payment + realtime status) ──
function PaymentSection({ job, isClient, onPaymentChange }: { job: Job; isClient: boolean; onPaymentChange: () => void }) {
  const t = useTheme();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const loadPayment = useCallback(async () => {
    const { data } = await supabase.from("payments").select("*").eq("job_id", job.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    setPayment(data as Payment | null);
    setLoading(false);
  }, [job.id]);

  useEffect(() => {
    loadPayment();
    const sub = supabase.channel(`payment:${job.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `job_id=eq.${job.id}` },
        () => { loadPayment(); onPaymentChange(); })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [job.id, loadPayment, onPaymentChange]);

  async function startPayment() {
    setPaying(true);
    const { data, error } = await supabase.functions.invoke("create-payment", { body: { job_id: job.id } });
    setPaying(false);
    if (error || !data?.checkout_url) {
      const code = (data as any)?.error;
      const msg = code === "provider_not_connected"
        ? "El prestador todavía no conectó su cuenta de MercadoPago."
        : (data as any)?.message ?? error?.message ?? code ?? "Intentalo de nuevo";
      toast(msg, "shield");
      return;
    }
    window.location.href = data.checkout_url;
  }

  if (loading) return null;

  const banner = (bg: string, border: string, fg: string, title: string, sub: string, icon: string) => (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: t.radius, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
      <Icon name={icon} size={20} color={fg} />
      <div><div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 14, color: fg }}>{title}</div>
        <div style={{ fontFamily: t.fontBody, fontSize: 12, color: fg, opacity: 0.85 }}>{sub}</div></div>
    </div>
  );

  if (payment?.status === "approved") return banner(t.greenSoft, t.greenSoft, t.greenDeep, "Pago confirmado", "El cobro fue acreditado correctamente", "check-circle");
  if (payment?.status === "rejected") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {banner("rgba(192,57,43,0.06)", "rgba(192,57,43,0.20)", t.danger, "Pago rechazado", "El cobro no pudo procesarse", "shield")}
      {isClient && <Button variant="green" size="lg" full onClick={startPayment} disabled={paying} icon={<Icon name="wallet" size={18} color="#fff" />}>{paying ? "Procesando..." : "Reintentar pago"}</Button>}
    </div>
  );
  if (payment?.status === "pending" && payment?.checkout_url) {
    if (!isClient) return banner("rgba(232,168,43,0.10)", "rgba(232,168,43,0.30)", "#9B6B12", "Esperando pago del cliente", "Te avisamos cuando se acredite", "clock");
    return <a href={payment.checkout_url} style={{ textDecoration: "none" }}><Button variant="green" size="lg" full icon={<Icon name="wallet" size={18} color="#fff" />}>Continuar pago</Button></a>;
  }
  if (isClient && job.price && job.price > 0 && ["accepted", "in_progress", "completed"].includes(job.status)) {
    return <Button variant="green" size="lg" full onClick={startPayment} disabled={paying} icon={<Icon name="shield" size={18} color="#fff" />}>{paying ? "Procesando..." : `Pagar ${fmtARS(job.price)} con MercadoPago`}</Button>;
  }
  return null;
}

// ── Reseña ──
function ReviewCard({ jobId, providerId, onDone }: { jobId: string; providerId: string; onDone: () => void }) {
  const t = useTheme();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit() {
    if (rating === 0) return;
    setLoading(true);
    const { error } = await supabase.from("reviews").insert({ job_id: jobId, client_id: user!.id, provider_id: providerId, rating, comment });
    setLoading(false);
    if (error) { toast("Error al enviar reseña", "shield"); return; }
    toast("¡Gracias por tu reseña!", "star");
    onDone();
  }
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius, padding: 18 }}>
      <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 15, color: t.ink, marginBottom: 12 }}>Calificá el trabajo</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => setRating(n)} style={{ all: "unset", cursor: "pointer" }}>
            <Icon name={n <= rating ? "star" : "star-outline"} size={34} color={n <= rating ? t.star : t.line} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Contá tu experiencia..."
        style={{ width: "100%", minHeight: 80, boxSizing: "border-box", resize: "none", padding: "12px 14px", background: t.surfaceAlt, border: `1px solid ${t.line}`, borderRadius: t.radiusSm, fontFamily: t.fontBody, fontSize: 14, color: t.ink, outline: "none", marginBottom: 12 }} />
      <Button variant="green" size="lg" full disabled={rating === 0 || loading} onClick={submit}>Publicar reseña</Button>
    </div>
  );
}

export default function JobDetail() {
  const t = useTheme();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [quoteForm, setQuoteForm] = useState({ amount: "", description: "" });
  const [sendingQuote, setSendingQuote] = useState(false);
  const [tab, setTab] = useState<"chat" | "resumen">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { tiers } = useCommissionTiers();

  const loadJob = useCallback(async () => {
    const { data } = await supabase.from("jobs").select("*, clients:users!jobs_client_id_fkey(id,name,avatar_url,city), providers(*, users(id,name,avatar_url,city))").eq("id", id).single();
    setJob(data); setLoading(false);
  }, [id]);
  const loadMessages = useCallback(async () => {
    const { data } = await supabase.from("messages").select("*").eq("job_id", id).order("created_at", { ascending: true });
    setMessages(data ?? []);
  }, [id]);
  const loadQuotes = useCallback(async () => {
    const { data } = await supabase.from("quotes").select("*, providers(*, users(id,name,avatar_url))").eq("job_id", id).order("created_at", { ascending: false });
    setQuotes(data ?? []);
  }, [id]);

  useEffect(() => {
    loadJob(); loadMessages(); loadQuotes();
    const sub = supabase.channel(`job:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `job_id=eq.${id}` },
        (payload) => setMessages(prev => [...prev, payload.new as Message]))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${id}` },
        () => loadJob())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [id, loadJob, loadMessages, loadQuotes]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const r = searchParams.get("payment");
    if (!r) return;
    const map: Record<string, string> = { success: "Pago iniciado. Acreditándose...", pending: "Pago en proceso.", failure: "El pago no pudo completarse" };
    if (map[r]) toast(map[r], r === "failure" ? "shield" : "check");
    searchParams.delete("payment"); setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (job?.status === "completed" && user?.role === "client")
      supabase.from("reviews").select("id").eq("job_id", id).maybeSingle().then(({ data }) => setHasReview(!!data));
  }, [job, id, user]);
  useEffect(() => {
    if (job?.status === "completed")
      supabase.from("payments").select("id").eq("job_id", id).eq("status", "approved").maybeSingle().then(({ data }) => setPaymentApproved(!!data));
  }, [job, id]);

  async function sendMessage() {
    if (!text.trim() || !user) return;
    setSending(true);
    await supabase.from("messages").insert({ job_id: id, sender_id: user.id, text: text.trim() });
    setText(""); setSending(false);
  }
  async function updateStatus(status: string) {
    const { error } = await supabase.from("jobs").update({ status }).eq("id", id);
    if (error) toast("Error al actualizar", "shield");
  }
  async function markProviderDone() {
    const { error } = await supabase.from("jobs").update({ provider_completed_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast("Error al marcar", "shield"); return; }
    await loadJob(); toast("Trabajo marcado como terminado", "check");
  }
  async function confirmCompletion() {
    const { error } = await supabase.from("jobs").update({ status: "completed", client_confirmed_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast("Error al confirmar", "shield"); return; }
    await loadJob(); toast("¡Trabajo confirmado!", "check");
  }
  async function acceptQuote(q: any) {
    await supabase.from("quotes").update({ status: "accepted" }).eq("id", q.id);
    await supabase.from("jobs").update({ price: q.amount, status: "accepted" }).eq("id", id);
    loadQuotes(); loadJob();
  }
  async function rejectQuote(q: any) {
    await supabase.from("quotes").update({ status: "rejected" }).eq("id", q.id); loadQuotes();
  }
  async function sendQuote() {
    if (!job?.provider_id || !quoteForm.amount) return;
    setSendingQuote(true);
    await supabase.from("quotes").insert({ job_id: id, provider_id: job.provider_id, amount: parseFloat(quoteForm.amount), description: quoteForm.description });
    await loadQuotes(); setQuoteForm({ amount: "", description: "" }); setSendingQuote(false);
  }

  if (loading) return <MobileScreen><div style={{ position: "absolute", inset: 0, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontFamily: t.fontBody, color: t.inkMute }}>Cargando...</div></div></MobileScreen>;
  if (!job) return <MobileScreen><div style={{ position: "absolute", inset: 0, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontFamily: t.fontBody, color: t.inkMute }}>Trabajo no encontrado</div></div></MobileScreen>;

  const isClient = user?.id === job.client_id;
  const isProvider = user?.id === job.providers?.user_id;
  const otherName = isClient ? (job.providers?.users?.name ?? "Sin asignar") : ((job as any).clients?.name ?? "Cliente");
  const otherAvatarHue = t.green;
  const cat = categoryByDbName(job.category);
  const canChat = !["cancelled", "completed"].includes(job.status);
  const awaitingConfirmation = job.status === "in_progress" && !!job.provider_completed_at;

  // stepper: 0 aceptado, 1 en curso, 2 finalizado (prov), 3 confirmado
  const stepIdx = job.status === "completed" ? 3 : awaitingConfirmation ? 2 : job.status === "in_progress" ? 1 : job.status === "accepted" ? 0 : -1;

  return (
    <MobileScreen>
      <div style={{ position: "absolute", inset: 0, background: t.bg, display: "flex", flexDirection: "column" }}>
        {/* header */}
        <div style={{ background: t.surface, padding: "54px 16px 14px", borderBottom: `1px solid ${t.lineSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => navigate("/dashboard")} style={{ all: "unset", cursor: "pointer", width: 40, height: 40, borderRadius: 999, background: t.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="arrow-left" size={20} color={t.ink} />
            </button>
            <Avatar initials={otherName.charAt(0).toUpperCase()} hue={otherAvatarHue} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: t.fontBody, fontSize: 14.5, fontWeight: 700, color: t.ink }}>{otherName}</div>
              <div style={{ fontFamily: t.fontBody, fontSize: 11.5, color: t.inkMute }}>{cat?.label ?? job.category}</div>
            </div>
          </div>
          {/* job chip */}
          <div style={{ marginTop: 14, padding: "12px 14px", background: t.surfaceAlt, borderRadius: t.radiusSm, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${cat?.hue ?? t.green}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CategoryIcon name={cat?.id ?? "gasista"} size={18} color={cat?.hue ?? t.green} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: t.fontBody, fontSize: 13, fontWeight: 700, color: t.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.description}</div>
              <div style={{ fontFamily: t.fontBody, fontSize: 11.5, color: t.inkMute }}>{job.address}</div>
            </div>
            {job.price ? <span style={{ fontFamily: t.fontDisplay, fontSize: 16, fontWeight: 700, color: t.ink }}>{fmtARS(job.price)}</span> : null}
          </div>
          {/* stepper */}
          {stepIdx >= 0 && (
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 4 }}>
              {["Aceptado", "En curso", "Finalizado", "Confirmado"].map((label, i, arr) => {
                const done = stepIdx >= i, current = stepIdx === i;
                return (
                  <div key={label} style={{ display: "contents" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: "0 0 auto" }}>
                      <div style={{ width: 22, height: 22, borderRadius: 999, background: done ? t.green : t.surface, border: `2px solid ${done ? t.green : t.line}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: current ? `0 0 0 4px ${t.greenSoft}` : "none" }}>
                        {done && stepIdx > i && <Icon name="check" size={11} color="#fff" stroke={3} />}
                        {current && <div style={{ width: 7, height: 7, borderRadius: 999, background: "#fff" }} />}
                      </div>
                      <span style={{ fontFamily: t.fontBody, fontSize: 9.5, fontWeight: current ? 700 : 500, color: done ? t.ink : t.inkSoft }}>{label}</span>
                    </div>
                    {i < arr.length - 1 && <div style={{ flex: 1, height: 2, background: stepIdx > i ? t.green : t.line, marginBottom: 16, borderRadius: 2 }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* tabs */}
        <div style={{ display: "flex", background: t.surface, padding: "0 16px", borderBottom: `1px solid ${t.lineSoft}` }}>
          {(["chat", "resumen"] as const).map(o => (
            <button key={o} onClick={() => setTab(o)} style={{ all: "unset", cursor: "pointer", padding: "12px 16px", position: "relative", fontFamily: t.fontBody, fontSize: 14, fontWeight: tab === o ? 700 : 500, color: tab === o ? t.ink : t.inkMute }}>
              {o === "chat" ? "Chat" : "Resumen"}
              {tab === o && <div style={{ position: "absolute", left: 14, right: 14, bottom: 0, height: 2.5, background: t.ink, borderRadius: 3 }} />}
            </button>
          ))}
        </div>

        {tab === "chat" ? (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", fontFamily: t.fontBody, color: t.inkSoft, fontSize: 13 }}>Aún no hay mensajes. Iniciá la conversación.</div>}
              {messages.map(m => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "78%", background: mine ? t.green : t.surface, color: mine ? "#fff" : t.ink, borderRadius: 18, borderTopRightRadius: mine ? 4 : 18, borderTopLeftRadius: mine ? 18 : 4, padding: "10px 14px", border: mine ? "none" : `1px solid ${t.lineSoft}` }}>
                    <div style={{ fontFamily: t.fontBody, fontSize: 14, lineHeight: 1.4 }}>{m.text}</div>
                    <div style={{ fontFamily: t.fontBody, fontSize: 10, opacity: 0.55, marginTop: 4, textAlign: "right" }}>{format(new Date(m.created_at), "HH:mm")}</div>
                  </div>
                );
              })}
              {/* Cliente confirma trabajo terminado */}
              {isClient && awaitingConfirmation && (
                <div style={{ margin: "8px 0", padding: 16, background: "rgba(232,168,43,0.10)", border: "1px solid rgba(232,168,43,0.30)", borderRadius: t.radius, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="check-circle" size={20} color="#E8A82B" /><span style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 14, color: "#9B6B12" }}>El prestador marcó como finalizado</span></div>
                  <div style={{ fontFamily: t.fontBody, fontSize: 13, color: "#9B6B12", lineHeight: 1.45 }}>Revisá el trabajo y confirmá para cerrarlo. Después vas a poder calificar.</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button variant="outline" size="sm" onClick={() => toast("Usá el chat para resolver el inconveniente", "shield")}>Algo no está bien</Button>
                    <Button variant="green" size="sm" onClick={confirmCompletion}>Confirmar</Button>
                  </div>
                </div>
              )}
              {isProvider && awaitingConfirmation && (
                <div style={{ margin: "8px 0", padding: 14, background: "rgba(232,168,43,0.10)", border: "1px solid rgba(232,168,43,0.30)", borderRadius: t.radius, fontFamily: t.fontBody, fontSize: 13, color: "#9B6B12" }}>Esperando la confirmación del cliente para cerrar el trabajo.</div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {canChat ? (
              <div style={{ padding: "10px 14px 30px", background: t.surface, borderTop: `1px solid ${t.lineSoft}`, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 44, background: t.surfaceAlt, borderRadius: 999, display: "flex", alignItems: "center", padding: "0 16px" }}>
                  <input value={text} onChange={e => setText(e.target.value)} placeholder="Escribí un mensaje..." onKeyDown={e => e.key === "Enter" && sendMessage()}
                    style={{ all: "unset", flex: 1, fontFamily: t.fontBody, fontSize: 14, color: t.ink }} />
                </div>
                <button onClick={sendMessage} disabled={sending || !text.trim()} style={{ all: "unset", cursor: "pointer", width: 44, height: 44, borderRadius: 999, background: t.green, display: "flex", alignItems: "center", justifyContent: "center", opacity: sending || !text.trim() ? 0.5 : 1 }}>
                  <Icon name="send" size={18} color="#fff" />
                </button>
              </div>
            ) : (
              <div style={{ padding: "14px", background: t.surface, borderTop: `1px solid ${t.lineSoft}`, textAlign: "center", fontFamily: t.fontBody, fontSize: 12, color: t.inkMute }}>
                Este trabajo fue {job.status === "completed" ? "completado" : "cancelado"}
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* descripción */}
            <div style={{ background: t.surfaceAlt, borderRadius: t.radiusSm, padding: 14, fontFamily: t.fontBody, fontSize: 13.5, color: t.ink, lineHeight: 1.5 }}>{job.description}</div>

            {/* fotos del pedido */}
            {job.photos && job.photos.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {job.photos.map(url => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="" style={{ width: "100%", height: 96, objectFit: "cover", borderRadius: 10, border: `1px solid ${t.lineSoft}`, display: "block" }} />
                  </a>
                ))}
              </div>
            )}

            {/* comisión */}
            {job.price && job.price > 0 && job.status !== "cancelled" && <CommissionBreakdown amount={job.price} role={isProvider ? "provider" : "client"} />}

            {/* pago */}
            {(isClient || isProvider) && job.status !== "pending" && job.status !== "cancelled" && <PaymentSection job={job} isClient={isClient} onPaymentChange={loadJob} />}

            {/* acciones prestador: pending → cotizar + aceptar/rechazar */}
            {isProvider && job.status === "pending" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: t.surface, border: `1px solid ${t.lineSoft}`, borderRadius: t.radius, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 14, color: t.ink }}>Enviar cotización</div>
                  <Field label="Monto (ARS)" value={quoteForm.amount} onChange={(v: string) => setQuoteForm(f => ({ ...f, amount: v }))} placeholder="Ej: 28500" type="number" />
                  <Field label="Descripción (opcional)" value={quoteForm.description} onChange={(v: string) => setQuoteForm(f => ({ ...f, description: v }))} placeholder="Qué incluye" />
                  {parseFloat(quoteForm.amount) > 0 && (() => { const b = calculateCommission(parseFloat(quoteForm.amount), tiers); return <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.inkMute }}>Si la aceptan, cobrás <strong style={{ color: t.green }}>{fmtARS(b.providerNet)}</strong> (comisión {fmtARS(b.fee)})</div>; })()}
                  <Button variant="green" full disabled={!quoteForm.amount || sendingQuote} onClick={sendQuote}>Enviar cotización</Button>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Button variant="green" full onClick={() => updateStatus("accepted")}>Aceptar trabajo</Button>
                  <Button variant="outline" full onClick={() => updateStatus("cancelled")}>Rechazar</Button>
                </div>
              </div>
            )}
            {isProvider && job.status === "accepted" && <Button variant="green" size="lg" full onClick={() => updateStatus("in_progress")} icon={<Icon name="briefcase" size={18} color="#fff" />}>Iniciar trabajo</Button>}
            {isProvider && job.status === "in_progress" && !job.provider_completed_at && <Button variant="green" size="lg" full onClick={markProviderDone} icon={<Icon name="check" size={18} color="#fff" />}>Marcar como terminado</Button>}
            {isClient && awaitingConfirmation && <Button variant="green" size="lg" full onClick={confirmCompletion} icon={<Icon name="check-circle" size={18} color="#fff" />}>Confirmar trabajo completado</Button>}
            {isClient && job.status === "pending" && <Button variant="outline" size="lg" full onClick={() => updateStatus("cancelled")}>Cancelar solicitud</Button>}

            {/* cotizaciones (cliente) */}
            {quotes.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 700, color: t.inkMute, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cotizaciones</div>
                {quotes.map((q: any) => (
                  <div key={q.id} style={{ background: t.surface, border: `1px solid ${q.status === "accepted" ? t.green : t.lineSoft}`, borderRadius: t.radius, padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: t.fontDisplay, fontSize: 20, fontWeight: 700, color: t.ink }}>{fmtARS(parseFloat(q.amount))}</span>
                      <span style={{ fontFamily: t.fontBody, fontSize: 11, fontWeight: 700, color: q.status === "accepted" ? t.green : q.status === "rejected" ? t.inkSoft : "#9B6B12", textTransform: "uppercase" }}>{q.status === "accepted" ? "Aceptada" : q.status === "rejected" ? "Rechazada" : "Pendiente"}</span>
                    </div>
                    {q.description && <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.inkMute, marginTop: 6 }}>{q.description}</div>}
                    {isClient && q.status === "pending" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <Button variant="green" size="sm" full onClick={() => acceptQuote(q)}>Aceptar</Button>
                        <Button variant="outline" size="sm" full onClick={() => rejectQuote(q)}>Rechazar</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* reseña */}
            {isClient && job.status === "completed" && !hasReview && job.provider_id && paymentApproved && (
              <ReviewCard jobId={job.id} providerId={job.provider_id} onDone={() => setHasReview(true)} />
            )}
            {isClient && job.status === "completed" && !hasReview && !paymentApproved && (
              <div style={{ background: "rgba(232,168,43,0.10)", border: "1px solid rgba(232,168,43,0.30)", borderRadius: t.radius, padding: 14, fontFamily: t.fontBody, fontSize: 12.5, color: "#9B6B12", lineHeight: 1.5 }}>
                <strong>Reseña disponible tras el pago.</strong> Para calificar, el pago debe haberse hecho a través de ServiMarket. Así las reseñas provienen de trabajos reales.
              </div>
            )}
          </div>
        )}
      </div>
    </MobileScreen>
  );
}
