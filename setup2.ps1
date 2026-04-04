# Crear carpetas
New-Item -ItemType Directory -Force -Path "src\components\ui" | Out-Null
New-Item -ItemType Directory -Force -Path "src\pages" | Out-Null

# src/components/ui/toaster.tsx
Set-Content -Path "src\components\ui\toaster.tsx" -Encoding UTF8 -Value @'
import { useToast } from "./use-toast";
export function Toaster() {
  const { toasts } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(({ id, title, description, variant }) => (
        <div key={id} className={`rounded-lg px-4 py-3 shadow-lg text-sm max-w-sm ${variant === "destructive" ? "bg-red-600 text-white" : "bg-white border text-gray-900"}`}>
          {title && <div className="font-semibold">{title}</div>}
          {description && <div className="opacity-80">{description}</div>}
        </div>
      ))}
    </div>
  );
}
'@

# src/components/ui/use-toast.ts
Set-Content -Path "src\components\ui\use-toast.ts" -Encoding UTF8 -Value @'
import { useState } from "react";
type Toast = { id: string; title?: string; description?: string; variant?: "default" | "destructive" };
let toastFn: (t: Omit<Toast, "id">) => void = () => {};
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  toastFn = (t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3500);
  };
  return { toasts, toast: toastFn };
}
export const toast = (t: Omit<Toast, "id">) => toastFn(t);
'@

# src/components/ui/button.tsx
Set-Content -Path "src\components\ui\button.tsx" -Encoding UTF8 -Value @'
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default"|"outline"|"ghost"|"destructive"|"hero"|"glass";
  size?: "default"|"sm"|"lg"|"xl"|"icon";
  asChild?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant="default", size="default", asChild=false, children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:pointer-events-none";
    const variants: Record<string, string> = {
      default: "bg-indigo-600 text-white hover:bg-indigo-700",
      outline: "border border-input bg-background hover:bg-muted",
      ghost: "hover:bg-muted",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      hero: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg",
      glass: "bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20",
    };
    const sizes: Record<string, string> = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-8 px-3 text-xs",
      lg: "h-11 px-6 text-base",
      xl: "h-12 px-8 text-base",
      icon: "h-10 w-10",
    };
    if (asChild && children) {
      const child = children as React.ReactElement;
      return { ...child, props: { ...child.props, className: cn(base, variants[variant], sizes[size], className), ref } };
    }
    return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</button>;
  }
);
Button.displayName = "Button";
'@

# src/components/ui/input.tsx
Set-Content -Path "src\components\ui\input.tsx" -Encoding UTF8 -Value @'
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn("flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50", className)} {...props} />
  )
);
Input.displayName = "Input";
'@

# src/components/ui/label.tsx
Set-Content -Path "src\components\ui\label.tsx" -Encoding UTF8 -Value @'
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
export const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("text-sm font-medium leading-none", className)} {...props} />
  )
);
Label.displayName = "Label";
'@

# src/components/ui/card.tsx
Set-Content -Path "src\components\ui\card.tsx" -Encoding UTF8 -Value @'
import { cn } from "../../lib/utils";
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)} {...props} />;
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />;
}
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}
'@

# src/components/ui/badge.tsx
Set-Content -Path "src\components\ui\badge.tsx" -Encoding UTF8 -Value @'
import { cn } from "../../lib/utils";
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default"|"secondary"|"outline"|"destructive";
}
export function Badge({ className, variant="default", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-indigo-600 text-white",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input",
    destructive: "bg-red-100 text-red-700",
  };
  return <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", variants[variant], className)} {...props} />;
}
'@

# src/components/ui/select.tsx
Set-Content -Path "src\components\ui\select.tsx" -Encoding UTF8 -Value @'
import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { ChevronDown } from "lucide-react";
interface SelectProps { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode; }
export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} className="relative">
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child;
        if ((child.type as any).displayName === "SelectTrigger") return React.cloneElement(child as any, { onClick: () => setOpen(!open), value });
        if ((child.type as any).displayName === "SelectContent") return open ? React.cloneElement(child as any, { onSelect: (v: string) => { onValueChange?.(v); setOpen(false); } }) : null;
        return child;
      })}
    </div>
  );
}
export function SelectTrigger({ className, children, onClick, value, placeholder }: any) {
  return (
    <button type="button" onClick={onClick} className={cn("flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring", className)}>
      <span className={value ? "" : "text-muted-foreground"}>{value || placeholder || "Seleccionar..."}</span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}
SelectTrigger.displayName = "SelectTrigger";
export function SelectContent({ children, onSelect, className }: any) {
  return (
    <div className={cn("absolute top-full left-0 z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg", className)}>
      {React.Children.map(children, child =>
        React.isValidElement(child) ? React.cloneElement(child as any, { onSelect }) : child
      )}
    </div>
  );
}
SelectContent.displayName = "SelectContent";
export function SelectItem({ value, children, onSelect, className }: any) {
  return (
    <div onClick={() => onSelect?.(value)} className={cn("cursor-pointer px-3 py-2 text-sm hover:bg-muted", className)}>
      {children}
    </div>
  );
}
export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span>{placeholder}</span>;
}
'@

# src/components/ui/switch.tsx
Set-Content -Path "src\components\ui\switch.tsx" -Encoding UTF8 -Value @'
import { cn } from "../../lib/utils";
interface SwitchProps { checked?: boolean; onCheckedChange?: (v: boolean) => void; className?: string; }
export function Switch({ checked, onCheckedChange, className }: SwitchProps) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onCheckedChange?.(!checked)}
      className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring", checked ? "bg-indigo-600" : "bg-gray-200", className)}>
      <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}
'@

# src/lib/utils.ts
Set-Content -Path "src\lib\utils.ts" -Encoding UTF8 -Value @'
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
'@

# src/pages/Index.tsx (landing page)
Set-Content -Path "src\pages\Index.tsx" -Encoding UTF8 -Value @'
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Search, Shield, Star, Zap, MapPin, MessageSquare, CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";
const categories = ["Gasista","Electricista","Plomero","Flete","Pintor","Cerrajero","Carpintero","Jardinero","Limpieza","Técnico Aire","Albañil"];
const features = [
  { icon: Search, title: "Búsqueda inteligente", description: "Encontrá profesionales cerca tuyo, filtrados por categoría y calificación." },
  { icon: Shield, title: "Profesionales verificados", description: "Todos nuestros prestadores pasan por verificación documental." },
  { icon: Star, title: "Calificaciones reales", description: "Leé opiniones de otros usuarios antes de contratar." },
  { icon: MessageSquare, title: "Chat directo", description: "Comunicarte directamente con el prestador antes del servicio." },
  { icon: CreditCard, title: "Pagos seguros", description: "Pagá con MercadoPago. Tu dinero está protegido." },
  { icon: Zap, title: "Respuesta rápida", description: "Recibí cotizaciones en minutos, no en días." },
];
export default function Index() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <span className="font-bold text-2xl text-gradient">ServiMarket</span>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Mi Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2">Iniciar sesión</Link>
                <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Comenzar gratis</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <section className="py-24 bg-gradient-to-br from-indigo-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">Encontrá el profesional perfecto <span className="text-gradient">cerca de vos</span></h1>
          <p className="text-xl text-gray-600 mb-10">Conectamos clientes con los mejores prestadores de servicios. Gasistas, electricistas, plomeros, fletes y más.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700">
              <Search className="h-5 w-5" /> Buscar profesionales
            </Link>
            <Link to="/register" className="border border-gray-300 px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50">
              Ofrecer mis servicios <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            {["+1000 profesionales","Pagos seguros","Garantía de satisfacción"].map(t => (
              <div key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{t}</div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Categorías de servicios</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(c => (
              <Link key={c} to={`/search?category=${c}`} className="bg-white border rounded-xl px-4 py-3 text-sm font-medium hover:border-indigo-400 hover:shadow-sm transition-all">{c}</Link>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-14">¿Por qué ServiMarket?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(f => (
              <div key={f.title} className="p-6 border rounded-2xl hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4"><f.icon className="h-6 w-6 text-indigo-600" /></div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 bg-indigo-600">
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">¿Listo para encontrar al profesional ideal?</h2>
          <p className="text-indigo-100 mb-8">Uníte a miles de usuarios que ya confían en ServiMarket</p>
          <Link to="/register" className="bg-white text-indigo-600 font-semibold px-8 py-4 rounded-xl inline-flex items-center gap-2 hover:bg-indigo-50">
            Crear cuenta gratis <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
      <footer className="py-10 border-t">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <span className="font-bold text-xl text-gradient">ServiMarket</span>
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Argentina 🇦🇷</div>
          <span>© 2024 ServiMarket. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
'@

# src/pages/Login.tsx
Set-Content -Path "src\pages\Login.tsx" -Encoding UTF8 -Value @'
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ui/use-toast";
import { Loader2 } from "lucide-react";
export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(form.email, form.password);
    setLoading(false);
    if (error) toast({ title: "Error al iniciar sesión", description: "Email o contraseña incorrectos.", variant: "destructive" });
    else navigate("/dashboard");
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border shadow-sm p-8">
        <div className="text-center mb-6">
          <Link to="/" className="font-bold text-2xl text-gradient">ServiMarket</Link>
          <p className="text-gray-500 mt-1 text-sm">Ingresá con tu cuenta</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-sm font-medium block mb-1">Email</label>
            <input type="email" placeholder="tu@email.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required
              className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="text-sm font-medium block mb-1">Contraseña</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required
              className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <button type="submit" disabled={loading} className="w-full h-10 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Ingresar
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">¿No tenés cuenta? <Link to="/register" className="text-indigo-600 font-medium hover:underline">Registrate gratis</Link></p>
      </div>
    </div>
  );
}
'@

# src/pages/Register.tsx
Set-Content -Path "src\pages\Register.tsx" -Encoding UTF8 -Value @'
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ui/use-toast";
import { Loader2, User, Wrench } from "lucide-react";
export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "client" as "client"|"provider" });
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { toast({ title: "Contraseña muy corta", description: "Mínimo 8 caracteres.", variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.name, form.role);
    setLoading(false);
    if (error) toast({ title: "Error al registrarse", description: error.message, variant: "destructive" });
    else { toast({ title: "¡Cuenta creada!" }); navigate("/dashboard"); }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border shadow-sm p-8">
        <div className="text-center mb-6">
          <Link to="/" className="font-bold text-2xl text-gradient">ServiMarket</Link>
          <p className="text-gray-500 mt-1 text-sm">Elegí tu rol y completá tus datos</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {([{value:"client",label:"Soy Cliente",sub:"Busco servicios",Icon:User},{value:"provider",label:"Soy Prestador",sub:"Ofrezco servicios",Icon:Wrench}] as const).map(({value,label,sub,Icon}) => (
            <button key={value} type="button" onClick={() => setForm(f => ({...f, role: value}))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${form.role===value?"border-indigo-600 bg-indigo-50":"border-gray-200 hover:border-indigo-300"}`}>
              <Icon className={`h-6 w-6 mb-2 ${form.role===value?"text-indigo-600":"text-gray-400"}`} />
              <div className="font-semibold text-sm">{label}</div>
              <div className="text-xs text-gray-400">{sub}</div>
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-sm font-medium block mb-1">Nombre completo</label>
            <input placeholder="Juan Pérez" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required
              className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="text-sm font-medium block mb-1">Email</label>
            <input type="email" placeholder="tu@email.com" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required
              className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="text-sm font-medium block mb-1">Contraseña</label>
            <input type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} required minLength={8}
              className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <button type="submit" disabled={loading} className="w-full h-10 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Crear cuenta gratis
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">¿Ya tenés cuenta? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Iniciá sesión</Link></p>
      </div>
    </div>
  );
}
'@

# src/pages/Settings.tsx
Set-Content -Path "src\pages\Settings.tsx" -Encoding UTF8 -Value @'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/ui/use-toast";
import { ArrowLeft, Loader2, Save } from "lucide-react";
export default function Settings() {
  const { user, provider, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: user?.name??"", phone: user?.phone??"", city: user?.city??"", bio: provider?.bio??"", is_available: provider?.is_available??true, service_radius_km: provider?.service_radius_km??10 });
  async function save() {
    setLoading(true);
    await supabase.from("users").update({ name: form.name, phone: form.phone, city: form.city }).eq("id", user!.id);
    if (provider) await supabase.from("providers").update({ bio: form.bio, is_available: form.is_available, service_radius_km: form.service_radius_km }).eq("id", provider.id);
    await refreshUser();
    setLoading(false);
    toast({ title: "¡Cambios guardados!" });
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b">
        <div className="max-w-lg mx-auto px-4 flex items-center gap-3 h-16">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <span className="font-semibold">Configuración</span>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold">Datos personales</h2>
          {[["Nombre",form.name,"name","text"],["Teléfono",form.phone,"phone","tel"],["Ciudad",form.city,"city","text"]].map(([label,value,key,type]) => (
            <div key={key as string}><label className="text-sm font-medium block mb-1">{label as string}</label>
              <input type={type as string} value={value as string} onChange={e => setForm(f => ({...f, [key as string]: e.target.value}))} className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          ))}
        </div>
        {provider && (
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <h2 className="font-semibold">Perfil de prestador</h2>
            <div><label className="text-sm font-medium block mb-1">Bio</label>
              <textarea value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="text-sm font-medium block mb-1">Radio de servicio (km)</label>
              <input type="number" value={form.service_radius_km} onChange={e => setForm(f=>({...f,service_radius_km:parseInt(e.target.value)}))} className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div className="flex items-center justify-between">
              <div><div className="font-medium text-sm">Disponible</div><div className="text-xs text-gray-500">Aparecés en búsquedas</div></div>
              <button type="button" onClick={() => setForm(f=>({...f,is_available:!f.is_available}))}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.is_available?"bg-indigo-600":"bg-gray-200"}`}>
                <span className={`inline-block h-4 w-4 mt-1 transform rounded-full bg-white transition-transform ${form.is_available?"translate-x-6":"translate-x-1"}`} />
              </button>
            </div>
          </div>
        )}
        <button onClick={save} disabled={loading} className="w-full h-12 bg-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar cambios
        </button>
      </div>
    </div>
  );
}
'@

# src/pages/ProviderProfile.tsx
Set-Content -Path "src\pages\ProviderProfile.tsx" -Encoding UTF8 -Value @'
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { ArrowLeft, Star, MapPin, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
export default function ProviderProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from("providers").select("*, users(*)").eq("id", id).single();
      setProvider(p);
      const { data: r } = await supabase.from("reviews").select("*, clients:users!reviews_client_id_fkey(*)").eq("provider_id", id).order("created_at", { ascending: false }).limit(20);
      setReviews(r ?? []);
      setLoading(false);
    }
    load();
  }, [id]);
  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!provider) return <div className="text-center py-24 text-gray-500">Prestador no encontrado</div>;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-3 h-16">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <span className="font-semibold">Perfil del prestador</span>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl border p-6 flex items-start gap-5">
          <div className="h-20 w-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600 shrink-0">
            {provider.users?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{provider.users?.name}</h1>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {provider.categories.map((c: string) => <span key={c} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-0.5 rounded-full">{c}</span>)}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {provider.reviews_count > 0 && <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /><span className="font-medium text-gray-900">{provider.rating_avg.toFixed(1)}</span><span>({provider.reviews_count})</span></div>}
              <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /><span>Radio {provider.service_radius_km} km</span></div>
            </div>
            {provider.documents_verified && <div className="flex items-center gap-1.5 mt-2 text-emerald-600 text-sm font-medium"><CheckCircle2 className="h-4 w-4" />Prestador verificado</div>}
          </div>
        </div>
        {user?.role === "client" && (
          <button onClick={() => navigate(`/jobs/new?provider=${id}`)} className="w-full h-12 bg-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-indigo-700">
            <MessageSquare className="h-5 w-5" /> Contratar a {provider.users?.name?.split(" ")[0]}
          </button>
        )}
        {provider.bio && <div className="bg-white rounded-2xl border p-6"><h2 className="font-semibold mb-2">Sobre mí</h2><p className="text-gray-500 text-sm">{provider.bio}</p></div>}
        {provider.price_list?.length > 0 && (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="font-semibold mb-3">Lista de precios</h2>
            <div className="divide-y">
              {provider.price_list.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <span className="text-sm">{item.service}</span>
                  <span className="text-sm font-semibold text-indigo-600">{item.price === 0 ? "A presupuestar" : `$${item.price.toLocaleString()} / ${item.unit}`}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-semibold mb-3">Reseñas {provider.reviews_count > 0 && `(${provider.reviews_count})`}</h2>
          {reviews.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">Sin reseñas todavía</p> : (
            <div className="space-y-4">
              {reviews.map((r: any) => (
                <div key={r.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div><div className="font-medium text-sm">{r.clients?.name}</div>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`h-3.5 w-3.5 ${i<=r.rating?"fill-yellow-400 text-yellow-400":"text-gray-200"}`} />)}</div>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("es-AR")}</span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-500 mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
'@

# src/pages/JobCreate.tsx
Set-Content -Path "src\pages\JobCreate.tsx" -Encoding UTF8 -Value @'
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/ui/use-toast";
import { ArrowLeft, Loader2, Send } from "lucide-react";
const CATEGORIES = ["Gasista","Electricista","Plomero","Flete","Pintor","Cerrajero","Carpintero","Jardinero","Limpieza","Técnico Aire","Albañil"];
export default function JobCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const providerId = searchParams.get("provider");
  const [form, setForm] = useState({ category: "", description: "", address: "", scheduledAt: "", price: "" });
  useEffect(() => {
    if (providerId) supabase.from("providers").select("*, users(*)").eq("id", providerId).single().then(({ data }) => { setProvider(data); if (data?.categories[0]) setForm(f => ({...f, category: data.categories[0]})); });
  }, [providerId]);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form.category || !form.description || !form.address) { toast({ title: "Completá todos los campos", variant: "destructive" }); return; }
    setLoading(true);
    const { data, error } = await supabase.from("jobs").insert({ client_id: user.id, provider_id: providerId??null, category: form.category, description: form.description, address: form.address, scheduled_at: form.scheduledAt||null, price: form.price?parseFloat(form.price):null, status: "pending" }).select().single();
    setLoading(false);
    if (error) { toast({ title: "Error al crear el trabajo", variant: "destructive" }); return; }
    toast({ title: "¡Solicitud enviada!" });
    navigate(`/jobs/${data.id}`);
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b">
        <div className="max-w-lg mx-auto px-4 flex items-center gap-3 h-16">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <span className="font-semibold">Nueva solicitud</span>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-8">
        {provider && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-700">{provider.users?.name?.charAt(0)}</div>
            <div><p className="font-medium text-sm">{provider.users?.name}</p><p className="text-xs text-gray-500">{provider.categories.join(", ")}</p></div>
          </div>
        )}
        <div className="bg-white rounded-2xl border p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className="text-sm font-medium block mb-1">Categoría *</label>
              <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} required className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Elegí un servicio</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className="text-sm font-medium block mb-1">Descripción *</label>
              <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} required placeholder="Describí qué necesitás..." className="w-full border rounded-lg px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
            <div><label className="text-sm font-medium block mb-1">Dirección *</label>
              <input value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} required placeholder="Calle 123, Barrio, Ciudad" className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="text-sm font-medium block mb-1">Fecha y hora (opcional)</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f=>({...f,scheduledAt:e.target.value}))} className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="text-sm font-medium block mb-1">Presupuesto máximo (opcional)</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} placeholder="0" className="w-full h-10 border rounded-lg pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div></div>
            <button type="submit" disabled={loading} className="w-full h-12 bg-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar solicitud
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
'@

Write-Host "✅ Todos los archivos creados!" -ForegroundColor Green
```