import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Job } from "../types";
import { Plus, Search, LogOut, Settings, Bell, MapPin, Clock, ChevronRight, Star, Wrench, TrendingUp, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:     { label: "Pendiente",   color: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400" },
  accepted:    { label: "Aceptado",    color: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-400" },
  in_progress: { label: "En progreso", color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  completed:   { label: "Completado",  color: "bg-green-50 text-green-700 border-green-200",   dot: "bg-green-500" },
  cancelled:   { label: "Cancelado",   color: "bg-gray-50 text-gray-500 border-gray-200",      dot: "bg-gray-400" },
};

function JobCard({ job, isClient }: { job: Job; isClient: boolean }) {
  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
  const other = isClient ? job.providers?.users?.name ?? "Sin asignar" : (job as any).clients?.name ?? "Cliente";
  return (
    <Link to={`/jobs/${job.id}`}>
      <div className="bg-white border border-gray-100 rounded-2xl p-5 card-hover cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-green-100">{job.category}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
              </span>
            </div>
            <p className="font-semibold text-gray-900 truncate">{other}</p>
            <p className="text-sm text-gray-400 line-clamp-1 mt-0.5">{job.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.address}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(job.created_at), { locale: es, addSuffix: true })}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {job.price && <span className="text-sm font-bold text-green-700">${job.price.toLocaleString()}</span>}
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user, provider, signOut } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active"|"history">("active");
  const isClient = user?.role === "client";

  useEffect(() => {
    if (!user) return;
    async function load() {
      let q = supabase.from("jobs").select("*, clients:users!jobs_client_id_fkey(*), providers(*, users(*))").order("created_at", { ascending: false });
      if (isClient) q = q.eq("client_id", user!.id);
      else q = q.eq("provider_id", provider?.id ?? "");
      const { data } = await q;
      setJobs(data ?? []);
      setLoading(false);
    }
    load();
  }, [user, provider, isClient]);

  const active = jobs.filter(j => !["completed","cancelled"].includes(j.status));
  const history = jobs.filter(j => ["completed","cancelled"].includes(j.status));
  const displayed = activeTab === "active" ? active : history;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center"><Wrench className="h-3.5 w-3.5 text-white" /></div>
            <span className="font-bold text-lg">ServiMarket</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate("/settings")} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><Settings className="h-5 w-5 text-gray-500" /></button>
            <button onClick={async () => { await signOut(); navigate("/"); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><LogOut className="h-5 w-5 text-gray-500" /></button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-0.5">Bienvenido de nuevo</p>
          <h1 className="text-2xl font-bold text-gray-900">{user?.name} 👋</h1>
        </div>

        {/* Stats for providers */}
        {!isClient && provider && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Briefcase, label: "Activos", value: active.length, color: "text-blue-600", bg: "bg-blue-50" },
              { icon: TrendingUp, label: "Completados", value: history.filter(j=>j.status==="completed").length, color: "text-green-600", bg: "bg-green-50" },
              { icon: Star, label: "Rating", value: provider.rating_avg.toFixed(1), color: "text-amber-600", bg: "bg-amber-50" },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
                <div className={`h-9 w-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div className="text-xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          {isClient && (
            <button onClick={() => navigate("/jobs/new")} className="flex-1 bg-green-600 text-white rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-sm shadow-green-200">
              <Plus className="h-5 w-5" /> Nueva solicitud
            </button>
          )}
          <button onClick={() => navigate("/search")} className={`${isClient ? "flex-1" : "w-full"} bg-white border border-gray-200 text-gray-700 rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors`}>
            <Search className="h-5 w-5" /> Buscar prestadores
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5">
          {(["active","history"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
              {tab === "active" ? `Activos (${active.length})` : `Historial (${history.length})`}
            </button>
          ))}
        </div>

        {/* Jobs */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl" />)}</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Briefcase className="h-7 w-7 text-gray-300" /></div>
            <p className="font-semibold text-gray-500">{activeTab === "active" ? "No tenés trabajos activos" : "Sin historial aíºn"}</p>
            {isClient && activeTab === "active" && (
              <button onClick={() => navigate("/jobs/new")} className="mt-4 bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-green-700 transition-colors">
                Crear primera solicitud
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">{displayed.map(j => <JobCard key={j.id} job={j} isClient={isClient} />)}</div>
        )}
      </div>
    </div>
  );
}
