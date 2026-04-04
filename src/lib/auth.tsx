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
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', supaUser.id)
        .single();
      if (data) {
        setUser(data);
        if (data.role === 'provider') {
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

  return (
    <AuthContext.Provider value={{
      supabaseUser, user, provider, session, loading,
      signUp, signIn, signOut, refreshUser,
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