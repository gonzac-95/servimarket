import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Provider, Job, Payment } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/use-toast';
import { Users, Briefcase, CreditCard, Shield, Home, Search, CheckCircle, XCircle, Loader2, Wallet, Plus, Trash2, Save, FileCheck, Eye, BadgeCheck } from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { resetFeatureCache } from '../lib/features';
import { calculateCommission, formatARS, type CommissionTier } from '../lib/commission';

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Users Admin ----
function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // RPC con check de admin: la lectura directa de users ya no expone emails
    supabase.rpc('admin_list_users', { p_limit: 50 })
      .then(({ data }) => { setUsers((data as User[]) ?? []); setLoading(false); });
  }, []);

  async function toggleBlock(user: User) {
    const { error } = await supabase.rpc('admin_set_blocked', { p_user: user.id, p_blocked: !user.is_blocked });
    if (error) { toast({ title: 'Error al actualizar', variant: 'destructive' }); return; }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_blocked: !u.is_blocked } : u));
    toast({ title: user.is_blocked ? 'Usuario desbloqueado' : 'Usuario bloqueado' });
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Buscar usuario..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
        <div className="divide-y border rounded-xl overflow-hidden bg-card">
          {filtered.map(u => (
            <div key={u.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-sm">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
                <div className="flex gap-1.5 mt-1">
                  <Badge variant="outline" className="text-xs">{u.role}</Badge>
                  {u.is_blocked && <Badge variant="destructive" className="text-xs">Bloqueado</Badge>}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleBlock(u)}
                className={u.is_blocked ? 'text-emerald-600' : 'text-red-600'}
              >
                {u.is_blocked ? <><CheckCircle className="h-4 w-4 mr-1" />Desbloquear</> : <><XCircle className="h-4 w-4 mr-1" />Bloquear</>}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Providers Admin ----
// La verificación ya no se togglea a mano: surge de los documentos aprobados
// (DNI aprobado = aparece en búsquedas). Se revisa en "Verificaciones".
function AdminProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('providers').select('*, users(id,name,avatar_url,city)').order('created_at', { ascending: false })
      .then(({ data }) => { setProviders(data as Provider[] ?? []); setLoading(false); });
  }, []);

  const shown = providers.filter(p => filter === 'all' || (filter === 'verified' ? p.documents_verified : !p.documents_verified));

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {([['all', 'Todos'], ['verified', 'Verificados'], ['unverified', 'Sin verificar']] as const).map(([id, label]) => (
          <Button key={id} size="sm" variant={filter === id ? 'default' : 'outline'} onClick={() => setFilter(id)}>{label}</Button>
        ))}
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
        <div className="divide-y border rounded-xl overflow-hidden bg-card">
          {shown.map(p => (
            <div key={p.id} className="flex items-center justify-between p-4 gap-3">
              <div className="min-w-0">
                <div className="font-medium text-sm">{p.users?.name} <span className="text-xs text-muted-foreground font-normal">· {p.users?.city ?? 'sin ciudad'}</span></div>
                <div className="text-xs text-muted-foreground">{p.categories.join(', ') || 'Sin categorías'}</div>
                <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                  {p.documents_verified
                    ? <Badge className="text-xs bg-emerald-100 text-emerald-700">Visible</Badge>
                    : <Badge variant="outline" className="text-xs">Oculto</Badge>}
                  {p.dni_verified && <Badge className="text-xs bg-emerald-50 text-emerald-700">DNI</Badge>}
                  {p.background_check && <Badge className="text-xs bg-emerald-50 text-emerald-700">Antecedentes</Badge>}
                  {p.license_verified && <Badge className="text-xs bg-emerald-50 text-emerald-700">Matrícula</Badge>}
                  <span className="text-xs text-muted-foreground">★ {Number(p.rating_avg ?? 0).toFixed(1)} ({p.reviews_count})</span>
                </div>
              </div>
              <Link to={`/provider/${p.id}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></Link>
            </div>
          ))}
          {shown.length === 0 && <div className="p-6 text-sm text-center text-muted-foreground">No hay prestadores en este filtro.</div>}
        </div>
      )}
    </div>
  );
}

// ---- Verificación de documentos ----
const DOC_LABEL: Record<string, string> = { dni: 'DNI', background_check: 'Antecedentes', license: 'Matrícula' };

function AdminVerification() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('verification_documents')
      .select('*, providers(id, categories, users(id,name,city))')
      .eq('status', status).order('uploaded_at', { ascending: true }).limit(100);
    setDocs(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function open(doc: any) {
    const { data } = await supabase.storage.from('verification-documents').createSignedUrl(doc.file_url, 120);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener');
    else toast({ title: 'No se pudo abrir el archivo', variant: 'destructive' });
  }

  async function review(doc: any, next: 'approved' | 'rejected', reasonOverride?: string) {
    const why = (reasonOverride ?? reason).trim();
    if (next === 'rejected' && !why) { toast({ title: 'Indicá el motivo del rechazo', variant: 'destructive' }); return; }
    setBusy(doc.id);
    const { error } = await supabase.from('verification_documents')
      .update({ status: next, rejection_reason: next === 'rejected' ? why : null })
      .eq('id', doc.id);
    setBusy(null);
    if (error) { toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' }); return; }
    toast({ title: next === 'approved' ? 'Documento aprobado' : 'Documento rechazado', description: 'El prestador recibe una notificación.' });
    setRejecting(null); setReason('');
    setDocs(prev => prev.filter(d => d.id !== doc.id));
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {([['pending', 'Pendientes'], ['approved', 'Aprobados'], ['rejected', 'Rechazados']] as const).map(([id, label]) => (
          <Button key={id} size="sm" variant={status === id ? 'default' : 'outline'} onClick={() => setStatus(id)}>{label}</Button>
        ))}
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : docs.length === 0 ? (
        <div className="p-6 text-sm text-center text-muted-foreground border rounded-xl bg-card">
          {status === 'pending' ? 'No hay documentos esperando revisión.' : 'Sin documentos en este estado.'}
        </div>
      ) : (
        <div className="divide-y border rounded-xl overflow-hidden bg-card">
          {docs.map(d => (
            <div key={d.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{DOC_LABEL[d.document_type] ?? d.document_type}</Badge>
                    <span className="font-medium text-sm">{d.providers?.users?.name ?? 'Prestador'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(d.providers?.categories ?? []).join(', ') || 'Sin categorías'} · {d.providers?.users?.city ?? 'sin ciudad'} · {new Date(d.uploaded_at).toLocaleString('es-AR')}
                  </div>
                  {d.rejection_reason && <div className="text-xs text-red-600 mt-1">Motivo: {d.rejection_reason}</div>}
                </div>
                <Button variant="outline" size="sm" onClick={() => open(d)}><Eye className="h-4 w-4 mr-1" />Ver</Button>
              </div>
              {status === 'pending' && (rejecting === d.id ? (
                <div className="flex gap-2">
                  <Input placeholder="Motivo (ej: la foto no se lee)" value={reason} onChange={e => setReason(e.target.value)} />
                  <Button size="sm" variant="outline" className="text-red-600" disabled={busy === d.id} onClick={() => review(d, 'rejected')}>Rechazar</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setRejecting(null); setReason(''); }}>Cancelar</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={busy === d.id} onClick={() => review(d, 'approved')}>
                    <CheckCircle className="h-4 w-4 mr-1" />Aprobar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => { setRejecting(d.id); setReason(''); }}>
                    <XCircle className="h-4 w-4 mr-1" />Rechazar
                  </Button>
                </div>
              ))}
              {status === 'approved' && (
                <Button size="sm" variant="ghost" className="text-red-600" disabled={busy === d.id}
                  onClick={() => review(d, 'rejected', 'aprobación revocada por el equipo')}>
                  Revocar aprobación
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Jobs Admin ----
function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('jobs')
      .select('*, clients:users!jobs_client_id_fkey(id,name,avatar_url,city), providers(*, users(id,name,avatar_url,city))')
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { setJobs(data as Job[] ?? []); setLoading(false); });
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700', accepted: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700', completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
        <div className="divide-y border rounded-xl overflow-hidden bg-card">
          {jobs.map(j => (
            <div key={j.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">{j.category}</Badge>
                    <Badge className={`text-xs ${STATUS_COLORS[j.status]}`}>{j.status}</Badge>
                  </div>
                  <div className="text-sm font-medium">{(j as any).clients?.name} → {j.providers?.users?.name ?? 'Sin asignar'}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-xs">{j.description}</div>
                </div>
                {j.price && <span className="text-sm font-bold text-primary">${j.price.toLocaleString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Commission Tiers Admin ----
function AdminCommission() {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string>('50000');

  useEffect(() => {
    supabase.from('app_config').select('value').eq('key', 'commission_tiers').single()
      .then(({ data }) => {
        setTiers((data?.value as CommissionTier[]) ?? []);
        setLoading(false);
      });
  }, []);

  function updateTier(i: number, patch: Partial<CommissionTier>) {
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, ...patch } : t));
  }
  function addTier() {
    const last = tiers[tiers.length - 1];
    const newMax = last && last.max !== null ? last.max + 50000 : 50000;
    const insertAt = tiers.findIndex(t => t.max === null);
    const next: CommissionTier = { max: newMax, fee: 5000 };
    setTiers(prev => insertAt === -1 ? [...prev, next] : [
      ...prev.slice(0, insertAt), next, ...prev.slice(insertAt),
    ]);
  }
  function removeTier(i: number) {
    setTiers(prev => prev.filter((_, idx) => idx !== i));
  }

  function validate(): string | null {
    if (tiers.length === 0) return 'Debe haber al menos un tramo';
    const nullCount = tiers.filter(t => t.max === null).length;
    if (nullCount !== 1) return 'Debe haber exactamente un tramo con tope abierto (sin tope)';
    if (tiers[tiers.length - 1].max !== null) return 'El tramo sin tope debe ser el último';
    for (let i = 0; i < tiers.length; i++) {
      if (tiers[i].fee < 0) return `Tramo ${i + 1}: la comisión no puede ser negativa`;
      if (tiers[i].max !== null && tiers[i].max! <= 0) return `Tramo ${i + 1}: el tope debe ser positivo`;
      if (i > 0) {
        const prev = tiers[i - 1].max;
        const curr = tiers[i].max;
        if (prev !== null && curr !== null && curr <= prev) {
          return `Tramo ${i + 1}: el tope debe ser mayor que el anterior`;
        }
      }
    }
    return null;
  }

  async function save() {
    const err = validate();
    if (err) { toast({ title: 'Configuración inválida', description: err, variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = await supabase.from('app_config')
      .update({ value: tiers })
      .eq('key', 'commission_tiers');
    setSaving(false);
    if (error) toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
    else toast({ title: 'Tramos actualizados', description: 'Aplicará a los nuevos pagos' });
  }

  const [paymentsOn, setPaymentsOn] = useState(false);
  useEffect(() => {
    supabase.from('app_config').select('value').eq('key', 'payments_enabled').maybeSingle()
      .then(({ data }) => setPaymentsOn(data?.value === true));
  }, []);
  async function togglePayments(next: boolean) {
    const { error } = await supabase.from('app_config').upsert({ key: 'payments_enabled', value: next });
    if (error) { toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' }); return; }
    setPaymentsOn(next); resetFeatureCache();
    toast({ title: next ? 'Cobro in-app activado' : 'Cobro in-app desactivado' });
  }

  const previewAmount = parseFloat(preview) || 0;
  const previewBreakdown = calculateCommission(previewAmount, tiers);

  if (loading) return <Loader2 className="h-6 w-6 animate-spin" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-sm">Cobro in-app con MercadoPago</div>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Apagado: cliente y prestador arreglan el pago entre ellos, no se muestra comisión y la reseña sólo exige
              la doble confirmación. Activalo cuando tengas CUIT y credenciales productivas de MercadoPago.
            </p>
          </div>
          <Switch checked={paymentsOn} onCheckedChange={togglePayments} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-emerald-600" /> Tramos de comisión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Cada tramo aplica si el precio del trabajo es menor o igual al tope. El último tramo (sin tope)
            aplica a todo lo que excede al anterior. Los cambios afectan únicamente a los pagos nuevos.
          </p>
          <div className="space-y-2">
            {tiers.map((t, i) => {
              const prevMax = i > 0 ? tiers[i - 1].max : 0;
              return (
                <div key={i} className="flex items-center gap-2 p-3 border rounded-xl bg-card">
                  <div className="text-xs text-muted-foreground w-24">
                    Desde {formatARS((prevMax ?? 0) + (i > 0 ? 1 : 0))}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Tope (max)</label>
                      <Input
                        type="number"
                        placeholder="Sin tope"
                        value={t.max ?? ''}
                        onChange={e => updateTier(i, {
                          max: e.target.value === '' ? null : parseFloat(e.target.value),
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Comisión fija (ARS)</label>
                      <Input
                        type="number"
                        value={t.fee}
                        onChange={e => updateTier(i, { fee: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeTier(i)} className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addTier}>
              <Plus className="h-4 w-4 mr-1" /> Agregar tramo
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simulador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Precio del trabajo (ARS)</label>
            <Input type="number" value={preview} onChange={e => setPreview(e.target.value)} />
          </div>
          {previewAmount > 0 && (
            <dl className="space-y-1 text-sm border rounded-xl p-3 bg-muted/30">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total</dt>
                <dd>{formatARS(previewBreakdown.amount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Comisión</dt>
                <dd>{formatARS(previewBreakdown.fee)}</dd>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t">
                <dt>Recibe el prestador</dt>
                <dd className="text-emerald-700">{formatARS(previewBreakdown.providerNet)}</dd>
              </div>
              <div className="text-xs text-muted-foreground pt-1">
                Take rate efectivo: {previewBreakdown.amount > 0
                  ? ((previewBreakdown.fee / previewBreakdown.amount) * 100).toFixed(1)
                  : '0'}%
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Main Admin ----
export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({ users: 0, jobs: 0, payments: 0, providers: 0, verified: 0, pendingDocs: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('id', { count: 'exact', head: true }),
      supabase.from('providers').select('id', { count: 'exact', head: true }),
      supabase.from('providers').select('id', { count: 'exact', head: true }).eq('documents_verified', true),
      supabase.from('verification_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]).then(([u, j, p, pr, v, pd]) => setStats({
      users: u.count ?? 0, jobs: j.count ?? 0,
      payments: p.count ?? 0, providers: pr.count ?? 0,
      verified: v.count ?? 0, pendingDocs: pd.count ?? 0,
    }));
  }, []);

  const navItems = [
    { path: '/admin', label: 'Inicio', icon: Home },
    { path: '/admin/users', label: 'Usuarios', icon: Users },
    { path: '/admin/verification', label: `Verificaciones${stats.pendingDocs ? ` (${stats.pendingDocs})` : ''}`, icon: FileCheck },
    { path: '/admin/providers', label: 'Prestadores', icon: Shield },
    { path: '/admin/jobs', label: 'Trabajos', icon: Briefcase },
    { path: '/admin/commission', label: 'Comisiones', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container flex items-center justify-between h-16">
          <span className="font-bold text-primary">ServiMarket Admin</span>
          <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>← App</Button>
        </div>
      </header>
      <div className="container py-6 max-w-4xl">
        {/* Nav */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}>
              <Button variant={location.pathname === path ? 'default' : 'outline'} size="sm">
                <Icon className="h-4 w-4 mr-1.5" />{label}
              </Button>
            </Link>
          ))}
        </div>

        <Routes>
          <Route path="/" element={
            <div>
              <h2 className="text-xl font-bold mb-6">Panel de administración</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Usuarios" value={stats.users} color="bg-blue-500" />
                <StatCard icon={Shield} label="Prestadores" value={stats.providers} color="bg-emerald-500" />
                <StatCard icon={Briefcase} label="Trabajos" value={stats.jobs} color="bg-purple-500" />
                <StatCard icon={CreditCard} label="Pagos" value={stats.payments} color="bg-orange-500" />
                <StatCard icon={BadgeCheck} label="Prestadores visibles" value={stats.verified} color="bg-teal-600" />
                <StatCard icon={FileCheck} label="Docs. por revisar" value={stats.pendingDocs} color="bg-amber-500" />
              </div>
            </div>
          } />
          <Route path="/users" element={<><h2 className="text-xl font-bold mb-6">Usuarios</h2><AdminUsers /></>} />
          <Route path="/verification" element={<><h2 className="text-xl font-bold mb-6">Verificaciones</h2><AdminVerification /></>} />
          <Route path="/providers" element={<><h2 className="text-xl font-bold mb-6">Prestadores</h2><AdminProviders /></>} />
          <Route path="/jobs" element={<><h2 className="text-xl font-bold mb-6">Trabajos</h2><AdminJobs /></>} />
          <Route path="/commission" element={<><h2 className="text-xl font-bold mb-6">Comisiones</h2><AdminCommission /></>} />
        </Routes>
      </div>
    </div>
  );
}
