import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Job, Message } from "../types";
import { useToast } from "../components/ui/use-toast";
import { ArrowLeft, Send, Loader2, Star, CheckCircle2, XCircle, Play, MapPin, Calendar, Clock, DollarSign } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:     { label: "Pendiente",   color: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-400" },
  accepted:    { label: "Aceptado",    color: "bg-blue-50 text-blue-700 border-blue-200",       dot: "bg-blue-400" },
  in_progress: { label: "En progreso", color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  completed:   { label: "Completado",  color: "bg-green-50 text-green-700 border-green-200",    dot: "bg-green-500" },
  cancelled:   { label: "Cancelado",   color: "bg-gray-50 text-gray-400 border-gray-200",       dot: "bg-gray-300" },
};

function ReviewModal({ jobId, providerId, onDone }: { jobId: string; providerId: string; onDone: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const { error } = await supabase.from("reviews").insert({ job_id: jobId, client_id: user!.id, provider_id: providerId, rating, comment });
    setLoading(false);
    if (error) { toast({ title: "Error al enviar reseí±a", variant: "destructive" }); return; }
    toast({ title: "Gracias por tu reseí±a!" });
    onDone();
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-400" /> Dejar una reseí±a
      </h3>
      <div className="flex gap-1 mb-4">
        {[1,2,3,4,5].map(i => (
          <button key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)} onClick={() => setRating(i)}>
            <Star className={`h-8 w-8 transition-colors ${i <= (hovered || rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
          </button>
        ))}
      </div>
      <textarea
        className="w-full min-h-[80px] border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
        placeholder="Contá tu experiencia..."
        value={comment}
        onChange={e => setComment(e.target.value)}
      />
      <button onClick={submit} disabled={loading}
        className="w-full h-11 bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Enviar reseí±a
      </button>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadJob = useCallback(async () => {
    const { data } = await supabase.from("jobs")
      .select("*, clients:users!jobs_client_id_fkey(*), providers(*, users(*))")
      .eq("id", id).single();
    setJob(data);
    setLoading(false);
  }, [id]);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase.from("messages").select("*, users(*)")
      .eq("job_id", id).order("created_at", { ascending: true });
    setMessages(data ?? []);
  }, [id]);

  useEffect(() => {
    loadJob();
    loadMessages();
    const sub = supabase.channel(`job:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `job_id=eq.${id}` },
        (payload) => setMessages(prev => [...prev, payload.new as Message]))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${id}` },
        () => loadJob())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [id, loadJob, loadMessages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (job?.status === "completed" && user?.role === "client") {
      supabase.from("reviews").select("id").eq("job_id", id).single().then(({ data }) => setHasReview(!!data));
    }
  }, [job, id, user]);

  async function sendMessage() {
    if (!text.trim() || !user) return;
    setSending(true);
    await supabase.from("messages").insert({ job_id: id, sender_id: user.id, text: text.trim() });
    setText("");
    setSending(false);
  }

  async function updateStatus(status: string) {
    const { error } = await supabase.from("jobs").update({ status }).eq("id", id);
    if (error) toast({ title: "Error al actualizar estado", variant: "destructive" });
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;
  if (!job) return <div className="text-center py-24 text-gray-400">Trabajo no encontrado</div>;

  const isClient = user?.id === job.client_id;
  const isProvider = user?.id === job.providers?.user_id;
  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
  const otherName = isClient ? job.providers?.users?.name ?? "Sin asignar" : (job as any).clients?.name ?? "Cliente";
  const otherInitial = otherName.charAt(0).toUpperCase();
  const canChat = !["cancelled","completed"].includes(job.status);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-3 h-16">
          <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="h-9 w-9 bg-green-100 rounded-xl flex items-center justify-center font-bold text-green-700 text-sm">{otherInitial}</div>
            <div>
              <div className="font-semibold text-sm text-gray-900">{otherName}</div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border inline-flex items-center gap-1 ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-4 w-full">
        {/* Job info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-xl border border-green-100">{job.category}</span>
            {job.price && <span className="font-bold text-green-700 flex items-center gap-1"><DollarSign className="h-4 w-4" />{job.price.toLocaleString()}</span>}
          </div>
          <p className="text-sm text-gray-700 mb-3">{job.description}</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.address}</span>
            {job.scheduled_at && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(job.scheduled_at), "d 'de' MMMM, HH:mm", { locale: es })}</span>}
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDistanceToNow(new Date(job.created_at), { locale: es, addSuffix: true })}</span>
          </div>
        </div>

        {/* Action buttons */}
        {isProvider && job.status === "pending" && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => updateStatus("accepted")} className="h-12 bg-green-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors">
              <CheckCircle2 className="h-5 w-5" /> Aceptar
            </button>
            <button onClick={() => updateStatus("cancelled")} className="h-12 bg-white border border-red-200 text-red-500 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
              <XCircle className="h-5 w-5" /> Rechazar
            </button>
          </div>
        )}
        {isProvider && job.status === "accepted" && (
          <button onClick={() => updateStatus("in_progress")} className="h-12 bg-purple-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors">
            <Play className="h-5 w-5" /> Iniciar trabajo
          </button>
        )}
        {isProvider && job.status === "in_progress" && (
          <button onClick={() => updateStatus("completed")} className="h-12 bg-green-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors">
            <CheckCircle2 className="h-5 w-5" /> Marcar como completado
          </button>
        )}
        {isClient && job.status === "pending" && (
          <button onClick={() => updateStatus("cancelled")} className="h-12 bg-white border border-red-200 text-red-500 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
            <XCircle className="h-5 w-5" /> Cancelar solicitud
          </button>
        )}

        {/* Review */}
        {isClient && job.status === "completed" && !hasReview && job.provider_id && (
          <ReviewModal jobId={job.id} providerId={job.provider_id} onDone={() => setHasReview(true)} />
        )}

        {/* Chat */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900">Mensajes</h3>
            <span className="text-xs text-gray-400">{messages.length} mensaje{messages.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[400px] bg-gray-50/30">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <Send className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">Aun no hay mensajes</p>
                <p className="text-xs text-gray-300 mt-1">Iniciá la conversacion</p>
              </div>
            )}
            {messages.map((m, i) => {
              const isMe = m.sender_id === user?.id;
              const prevMsg = messages[i - 1];
              const showName = !isMe && (!prevMsg || prevMsg.sender_id !== m.sender_id);
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] ${isMe ? "" : "flex gap-2"}`}>
                    {!isMe && (
                      <div className={`h-7 w-7 rounded-xl bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 shrink-0 mt-auto ${showName ? "" : "opacity-0"}`}>
                        {otherInitial}
                      </div>
                    )}
                    <div>
                      {showName && !isMe && <p className="text-xs text-gray-400 mb-1 ml-1">{otherName}</p>}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe
                        ? "bg-green-600 text-white rounded-br-sm"
                        : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"}`}>
                        <p>{m.text}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-green-200" : "text-gray-400"} text-right`}>
                          {format(new Date(m.created_at), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {canChat ? (
            <div className="p-3 border-t border-gray-100 flex gap-2 bg-white">
              <input
                className="flex-1 h-11 bg-gray-100 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                placeholder="Escribi un mensaje..."
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              />
              <button onClick={sendMessage} disabled={sending || !text.trim()}
                className="h-11 w-11 bg-green-600 text-white rounded-xl flex items-center justify-center hover:bg-green-700 transition-colors disabled:opacity-40 shrink-0">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-center text-gray-400">Este trabajo fue {job.status === "completed" ? "completado" : "cancelado"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
