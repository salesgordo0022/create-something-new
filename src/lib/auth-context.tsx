import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "./supabase";
import type { Usuario } from "./types";

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const DEV_USER: Usuario = {
  id: "dev-user",
  email: "admin@agro.com",
  nome: "Administrador",
  cargo: "Admin Master",
};

const SUPABASE_PLACEHOLDER = "https://seu-projeto.supabase.co";

function isDevMode() {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  return url === "" || url === SUPABASE_PLACEHOLDER;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signIn: async () => ({}),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(isDevMode() ? DEV_USER : null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDevMode()) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id);
      } else {
        setUser(null);
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
      else setUser(null);
    } catch {
      setUser(null);
    }
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    if (isDevMode()) {
      if (email === "admin@agro.com" && password === "admin123") {
        setUser(DEV_USER);
        return {};
      }
      return { error: "Credenciais inválidas. Use: admin@agro.com / admin123" };
    }
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
    if (isDevMode()) { setUser(null); return; }
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
