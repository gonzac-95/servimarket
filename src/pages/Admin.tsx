import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Provider, Job, Payment } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/use-toast';
import { Users, Briefcase, CreditCard, Shield, Home, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';

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
    supabase.from('users').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { setUsers(data ?? []); setLoading(false); });
  }, []);

  async function toggleBlock(user: User) {
    await supabase.from('users').update({ is_blocked: !user.is_blocked }).eq('id', user.id);
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
function AdminProviders() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('providers').select('*, users(*)').order('created_at', { ascending: false })
      .then(({ data }) => { setProviders(data as Provider[] ?? []); setLoading(false); });
  }, []);

  async function verify(provider: Provider) {
    await supabase.from('providers').update({ documents_verified: !provider.documents_verified }).eq('id', provider.id);
    setProviders(prev => prev.map(p => p.id === provider.id ? { ...p, documents_verified: !p.documents_verified } : p));
    toast({ title: provider.documents_verified ? 'Verificación removida' : '¡Prestador verificado!' });
  }

  return (
    <div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
        <div className="divide-y border rounded-xl overflow-hidden bg-card">
          {providers.map(p => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-sm">{p.users?.name}</div>
                <div className="text-xs text-muted-foreground">{p.categories.join(', ')}</div>
                <div className="flex gap-1.5 mt-1">
                  {p.documents_verified && <Badge className="text-xs bg-emerald-100 text-emerald-700">Verificado</Badge>}
                  <span className="text-xs text-muted-foreground">★ {p.rating_avg.toFixed(1)} ({p.reviews_count})</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => verify(p)}
                className={p.documents_verified ? 'text-red-600' : 'text-emerald-600'}
              >
                {p.documents_verified ? 'Quitar verificación' : '✓ Verificar'}
              </Button>
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
      .select('*, clients:users!jobs_client_id_fkey(*), providers(*, users(*))')
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

// ---- Main Admin ----
export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({ users: 0, jobs: 0, payments: 0, providers: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('id', { count: 'exact', head: true }),
      supabase.from('providers').select('id', { count: 'exact', head: true }),
    ]).then(([u, j, p, pr]) => setStats({
      users: u.count ?? 0, jobs: j.count ?? 0,
      payments: p.count ?? 0, providers: pr.count ?? 0,
    }));
  }, []);

  const navItems = [
    { path: '/admin', label: 'Inicio', icon: Home },
    { path: '/admin/users', label: 'Usuarios', icon: Users },
    { path: '/admin/providers', label: 'Prestadores', icon: Shield },
    { path: '/admin/jobs', label: 'Trabajos', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container flex items-center justify-between h-16">
          <span className="font-bold text-primary">ServiMarket Admin</span>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>← App</Button>
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
              </div>
            </div>
          } />
          <Route path="/users" element={<><h2 className="text-xl font-bold mb-6">Usuarios</h2><AdminUsers /></>} />
          <Route path="/providers" element={<><h2 className="text-xl font-bold mb-6">Prestadores</h2><AdminProviders /></>} />
          <Route path="/jobs" element={<><h2 className="text-xl font-bold mb-6">Trabajos</h2><AdminJobs /></>} />
        </Routes>
      </div>
    </div>
  );
}
