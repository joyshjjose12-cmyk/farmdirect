import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, getToken, setToken } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string | null;
}

export type UserRole = 'farmer' | 'buyer' | 'delivery';

/** Where each kind of user lands after logging in. */
export function homeFor(role: UserRole): string {
  if (role === 'farmer') return '/dashboard';
  if (role === 'delivery') return '/delivery';
  return '/marketplace';
}

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  farm_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  verified: boolean;
  email: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (params: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    farmName?: string;
    phone?: string;
  }) => Promise<{ error: string | null }>;
  signIn: (params: { email: string; password: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  function applySession(data: { user: AuthUser; profile: Profile } | null) {
    setUser(data?.user ?? null);
    setProfile(data?.profile ?? null);
  }

  // On page load: if we hold a token, ask the API who we are
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api.get<{ user: AuthUser; profile: Profile }>('/auth/me').then(({ data, error }) => {
      if (error || !data) setToken(null);
      applySession(data);
      setLoading(false);
    });
  }, []);

  async function signUp(params: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    farmName?: string;
    phone?: string;
  }) {
    const { data, error } = await api.post<{ token: string; user: AuthUser; profile: Profile }>(
      '/auth/signup',
      params
    );
    if (error || !data) return { error: error ?? 'Sign up failed.' };
    setToken(data.token);
    applySession(data);
    return { error: null };
  }

  async function signIn({ email, password }: { email: string; password: string }) {
    const { data, error } = await api.post<{ token: string; user: AuthUser; profile: Profile }>(
      '/auth/login',
      { email, password }
    );
    if (error || !data) return { error: error ?? 'Sign in failed.' };
    setToken(data.token);
    applySession(data);
    return { error: null };
  }

  async function signOut() {
    setToken(null);
    applySession(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
