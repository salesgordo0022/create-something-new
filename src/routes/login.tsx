import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.navigate({ to: "/gestao" });
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f2efe8' }}>
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-2xl agro-gradient-warm flex items-center justify-center mx-auto mb-5 shadow-xl shadow-[#0d4f1a]/15">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold" style={{ color: '#0d4f1a' }}>Diagnóstico Tributário</h1>
            <p className="text-gray-500 mt-2 text-lg">do Agronegócio</p>
          </div>
          <div className="bg-white rounded-3xl agro-shadow-xl border border-gray-100 p-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-8">Acesso da Equipe</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="agro-label text-sm">E-mail</label>
                <input type="email" className="agro-input py-3 px-4" placeholder="seu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="agro-label text-sm">Senha</label>
                <input type="password" className="agro-input py-3 px-4" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>}
              <button type="submit" disabled={loading}
                className="agro-button-primary w-full py-3.5 text-base disabled:opacity-50">
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
          <p className="text-sm text-gray-400 text-center mt-8">
            &copy; 2026 Diagnóstico Tributário do Agronegócio
          </p>
        </div>
      </div>
      <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80" alt="Colheita" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d4f1a]/90 via-[#0d4f1a]/60 to-[#0d4f1a]/40" />
        <div className="relative text-center px-12 z-10 max-w-lg">
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">Gestão Tributária Inteligente</h2>
          <p className="text-white/70 text-lg max-w-md mx-auto leading-relaxed">
            Plataforma completa para diagnóstico e planejamento tributário de produtores rurais
          </p>
          <div className="mt-10 grid grid-cols-3 gap-5 text-center">
            {['Produtores', 'Diagnósticos', 'Relatórios'].map((item) => (
              <div key={item} className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors">
                <div className="text-3xl font-bold text-[#e8b830]">{['320+', '280+', '150+'][['Produtores', 'Diagnósticos', 'Relatórios'].indexOf(item)]}</div>
                <div className="text-sm text-white/70 mt-1.5">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
