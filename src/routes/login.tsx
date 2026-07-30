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
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl agro-gradient-warm flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0d4f1a]/15">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#0d4f1a' }}>Diagnóstico Tributário</h1>
            <p className="text-gray-500 mt-1">do Agronegócio</p>
          </div>
          <div className="bg-white rounded-2xl agro-shadow-xl border border-gray-100 p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Acesso da Equipe</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="agro-label">E-mail</label>
                <input type="email" className="agro-input" placeholder="seu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="agro-label">Senha</label>
                <input type="password" className="agro-input" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
              <button type="submit" disabled={loading}
                className="agro-button-primary w-full py-3 disabled:opacity-50">
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
          <p className="text-xs text-gray-400 text-center mt-6">
            &copy; 2026 Diagnóstico Tributário do Agronegócio
          </p>
        </div>
      </div>
      <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d4f1a 0%, #1a7a2e 50%, #0d4f1a 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]">
          <div style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=80 height=80 viewBox=0 0 80 80 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%221%22%3E%3Cpath d=%22M60 40v-4h-4v4h-4v4h4v4h4v-4h4v-4h-4zm0-40V0h-4v4h-4v4h4v4h4V8h4V4h-4zM20 40v-4h-4v4h-4v4h4v4h4v-4h4v-4h-4zM20 0v-4h-4v4h-4v4h4v4h4V4h4V0h-4z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} className="absolute inset-0" />
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.06]">
          <svg viewBox="0 0 200 200" fill="white"><path d="M100 0c55.2 0 100 44.8 100 100s-44.8 100-100 100S0 155.2 0 100 44.8 0 100 0zm0 20C55.8 20 20 55.8 20 100s35.8 80 80 80 80-35.8 80-80-35.8-80-80-80z"/><circle cx="100" cy="100" r="30"/></svg>
        </div>
        <div className="relative text-center px-12 z-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Gestão Tributária Inteligente</h2>
          <p className="text-white/70 text-lg max-w-md mx-auto">
            Plataforma completa para diagnóstico e planejamento tributário de produtores rurais
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {['Produtores', 'Diagnósticos', 'Relatórios'].map((item) => (
              <div key={item} className="bg-white/8 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                <div className="text-2xl font-bold text-[#e8b830]">{['320+', '280+', '150+'][['Produtores', 'Diagnósticos', 'Relatórios'].indexOf(item)]}</div>
                <div className="text-xs text-white/60 mt-1">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
