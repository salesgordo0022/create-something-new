import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { supabase, isConfigured } from "./supabase";
import type { Usuario } from "./types";

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const DEMO_USER: Usuario = {
  id: "demo-user-id",
  email: "admin@contabilidade.com",
  nome: "Administrador",
  cargo: "Admin Master",
};

const AuthContext = createContext<AuthContextType>({
  user: DEMO_USER,
  loading: false,
  signIn: async () => ({}),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(DEMO_USER);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isConfigured) {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id);
      } else {
        setUser(DEMO_USER);
        setLoading(false);
      }
    }).catch(() => {
      setUser(DEMO_USER);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id);
      } else {
        setUser(DEMO_USER);
        setLoading(false);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  async function loadUser(authId: string) {
    try {
      const { data } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", authId)
        .single();
      if (data) setUser(data);
      else setUser(DEMO_USER);
    } catch {
      setUser(DEMO_USER);
    }
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    if (!isConfigured) return { error: "Supabase não configurado" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (data) setUser(data);
    }
    return {};
  }

  async function signOut() {
    setUser(DEMO_USER);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
