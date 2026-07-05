import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { User, Provider } from '../types';

interface AuthContextType {
  supabaseUser: SupabaseUser | null;
  user: User | null;
  provider: Provider | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: 'client' | 'provider') => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserProfile(supaUser: SupabaseUser) {
    try {
      // El perfil propio completo (email/teléfono incluidos) sale de una RPC:
      // la lectura directa de users sólo expone columnas públicas.
      const { data } = await supabase.rpc('get_my_profile').single();
      if (data) {
        setUser(data as User);
        if ((data as User).role === 'provider') {
          const { data: provData } = await supabase
            .from('providers')
            .select('*')
            .eq('user_id', supaUser.id)
            .single();
          setProvider(provData);
        }
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  }

  async function refreshUser() {
    if (supabaseUser) await loadUserProfile(supabaseUser);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          loadUserProfile(session.user).finally(() => setLoading(false));
        } else {
          setUser(null);
          setProvider(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string, name: string, role: 'client' | 'provider') {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, role } },
    });
    return { error: error as Error | null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProvider(null);
    setSession(null);
  }

  // Envía el email con el link para restablecer la contraseña.
  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  }

  // Actualiza la contraseña del usuario (requiere sesión activa,
  // que Supabase crea automáticamente al volver desde el link del email).
  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error as Error | null };
  }

  return (
    <AuthContext.Provider value={{
      supabaseUser, user, provider, session, loading,
      signUp, signIn, signOut, refreshUser, resetPassword, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}