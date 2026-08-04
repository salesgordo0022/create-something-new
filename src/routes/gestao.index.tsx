import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { getFormulariosCompletos, criarProdutorEFormulario } from "../lib/form-service";
import { exportCSV } from "../lib/form-secoes";
import { toast } from "sonner";

export const Route = createFileRoute("/gestao/")({
  component: GestaoPage,
});

interface FormComProdutor {
  id: string; produtor_id: string; link_id?: string; status_preenchimento: string; status_diagnostico: string;
  percentual_preenchido: number; protocolo?: string; data_envio?: string;
  produtores: { nome_razao: string; cpf_cnpj?: string; municipio?: string; estado?: string; atividade_principal?: string; tipo?: string };
}

const STATUS_OPTIONS = ['cadastro_criado','link_enviado','aguardando_preenchimento','em_preenchimento','formulario_enviado','em_analise','aguardando_documentos','aguardando_retorno_produtor','reuniao_agendada','diagnostico_concluido','apresentado_ao_produtor','arquivado'];

const STATUS_INFO: Record<string, { label: string; dot: string; badge: string }> = {
  cadastro_criado: { label: "Cadastro criado", dot: "bg-slate-400", badge: "bg-slate-50 text-slate-600 ring-slate-200" },
  link_enviado: { label: "Link enviado", dot: "bg-sky-500", badge: "bg-sky-50 text-sky-700 ring-sky-200" },
  aguardando_preenchimento: { label: "Aguardando preenchimento", dot: "bg-slate-400", badge: "bg-slate-50 text-slate-600 ring-slate-200" },
  em_preenchimento: { label: "Em preenchimento", dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700 ring-blue-200" },
  formulario_enviado: { label: "Formulário enviado", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  em_analise: { label: "Em análise", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  aguardando_documentos: { label: "Aguardando documentos", dot: "bg-orange-500", badge: "bg-orange-50 text-orange-700 ring-orange-200" },
  aguardando_retorno_produtor: { label: "Aguardando retorno", dot: "bg-yellow-500", badge: "bg-yellow-50 text-yellow-700 ring-yellow-200" },
  reuniao_agendada: { label: "Reunião agendada", dot: "bg-violet-500", badge: "bg-violet-50 text-violet-700 ring-violet-200" },
  diagnostico_concluido: { label: "Diagnóstico concluído", dot: "bg-green-600", badge: "bg-green-50 text-green-700 ring-green-200" },
  apresentado_ao_produtor: { label: "Apresentado ao produtor", dot: "bg-teal-500", badge: "bg-teal-50 text-teal-700 ring-teal-200" },
  arquivado: { label: "Arquivado", dot: "bg-stone-400", badge: "bg-stone-50 text-stone-600 ring-stone-200" },
};

function statusInfo(status: string) {
  return STATUS_INFO[status] || { label: status, dot: "bg-gray-400", badge: "bg-gray-50 text-gray-600 ring-gray-200" };
}

function initials(name?: string) {
  return (name || "?").split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

function GestaoPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [forms, setForms] = useState<FormComProdutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [criando, setCriando] = useState(false);
  const [novoNome, setNovoNome] = useState("");

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    const formsData = await getFormulariosCompletos();
    setForms(formsData as FormComProdutor[]);
    setLoading(false);
  }

  async function handleCriar() {
    setCriando(true);
    try {
      const result = await criarProdutorEFormulario({ nome_razao: novoNome || "Produtor" });
      setModalAberto(false);
      setNovoNome("");
      toast.success("Formulário criado!");
      router.navigate({ to: "/gestao/formulario/$id", params: { id: result.formId } });
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar");
    }
    setCriando(false);
  }

  function resetModal() {
    setModalAberto(false);
    setNovoNome("");
  }

  function exportarCSV() {
    const linhas = forms.map(f => {
      const st = statusInfo(f.status_preenchimento);
      return {
        "Produtor": f.produtores?.nome_razao || "",
        "CPF / CNPJ": f.produtores?.cpf_cnpj || "",
        "Município / UF": `${f.produtores?.municipio || ""}/${f.produtores?.estado || ""}`,
        "Atividade": f.produtores?.atividade_principal || "",
        "Tipo": f.produtores?.tipo || "",
        "Status": st.label,
        "Preenchimento (%)": f.percentual_preenchido ?? 0,
        "Protocolo": f.protocolo || "",
        "Data de envio": f.data_envio ? new Date(f.data_envio).toLocaleString("pt-BR") : "",
      };
    });
    if (linhas.length === 0) {
      toast.error("Não há registros para exportar");
      return;
    }
    exportCSV(linhas, `produtores-${new Date().toISOString().substring(0, 10)}.csv`);
    toast.success("CSV exportado");
  }

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f2efe8' }}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl agro-gradient-warm animate-pulse mx-auto" />
        <p className="mt-4 text-sm font-medium tracking-wide text-gray-400">Carregando diagnóstico...</p>
      </div>
    </div>
  );

  const formsFiltrados = forms.filter(f => {
    if (filtroNome && !f.produtores?.nome_razao?.toLowerCase().includes(filtroNome.toLowerCase())) return false;
    if (filtroEstado && f.produtores?.estado !== filtroEstado) return false;
    if (filtroStatus && f.status_preenchimento !== filtroStatus) return false;
    return true;
  });

  const estadosDisponiveis = [...new Set(forms.map(f => f.produtores?.estado).filter(Boolean))] as string[];
  const totalForms = forms.length;
  const emAnalise = forms.filter(f => f.status_preenchimento === 'em_analise').length;
  const concluidos = forms.filter(f => f.status_preenchimento === 'diagnostico_concluido').length;

  return (
    <div className="min-h-screen flex" style={{ background: '#f2efe8' }}>
      <aside className={`fixed lg:sticky top-0 left-0 z-50 w-72 h-screen text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="relative flex-1 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(160deg, #0a3d15 0%, #0d4f1a 45%, #123b18 100%)' }}>
          <img src="https://images.unsplash.com/photo-1585515328337-5f3eb6e2f3f3?w=400&q=60" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-[0.08]" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0a3d15] to-transparent" />

          <div className="relative p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl agro-gradient-warm flex items-center justify-center shadow-lg shadow-black/20 ring-1 ring-white/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <p className="font-serif font-bold text-sm tracking-wide">Diagnóstico Tributário</p>
                <p className="text-[11px] text-[#e8b830]/90 tracking-[0.18em] uppercase">do Agronegócio</p>
              </div>
            </div>
          </div>

          <nav className="relative p-4 space-y-1">
            <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Menu</p>
            <a href="/gestao" className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/10 text-white font-medium ring-1 ring-white/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Gestão de Diagnósticos
            </a>
            <a href="/gestao" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/50 hover:bg-white/5 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Configurações
            </a>
          </nav>

          <div className="relative mt-auto p-4">
            <div className="rounded-2xl bg-white/8 backdrop-blur-md ring-1 ring-white/10 p-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e8b830] to-[#d4a017] flex items-center justify-center font-serif font-bold text-[#0d4f1a] shadow-md">{user?.nome?.charAt(0)}</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate">{user?.nome}</p>
                  <p className="text-xs text-white/50 truncate">{user?.cargo}</p>
                </div>
              </div>
              <button onClick={() => signOut()} className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-h-screen flex flex-col">
        <header className="bg-white/85 backdrop-blur-xl border-b border-gray-200/60 px-6 lg:px-10 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-40">
          <div className="flex items-center gap-4 min-w-0">
            <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="hidden sm:block">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 font-semibold">Painel Administrativo</p>
              <p className="text-xs text-gray-500">Visão geral dos diagnósticos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <input className="w-64 lg:w-72 rounded-xl border border-gray-200 bg-gray-50/80 py-2 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/20 focus:border-[#1a5c2a] focus:bg-white transition-all" placeholder="Buscar produtor..." value={filtroNome} onChange={e => setFiltroNome(e.target.value)} />
              <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button onClick={exportarCSV} title="Exportar CSV de todos os produtores" className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white ring-1 ring-gray-200 hover:bg-gray-50 shadow-sm transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              CSV
            </button>
            <button onClick={() => setModalAberto(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0d4f1a] shadow-md shadow-amber-500/20 hover:shadow-lg transition-all" style={{ background: 'linear-gradient(135deg, #e8b830, #d4a017)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Novo Diagnóstico
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10">
          {sidebarOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

          <div className="relative mb-10 overflow-hidden rounded-3xl min-h-[220px] lg:min-h-[240px] agro-shadow-xl">
            <img src="https://images.unsplash.com/photo-1585515328337-5f3eb6e2f3f3?w=1600&q=80" alt="Plantação de soja" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a3d15]/95 via-[#0d4f1a]/75 to-[#0d4f1a]/30" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a3d15]/70 to-transparent" />
            <div className="relative z-10 px-8 lg:px-12 py-10 lg:py-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#e8b830] mb-3">Painel Administrativo</p>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight max-w-2xl">Gestão dos Diagnósticos Tributários</h1>
              <p className="text-white/70 text-sm lg:text-base mt-2 max-w-xl leading-relaxed">Acompanhe e gerencie os diagnósticos de todos os produtores rurais atendidos.</p>
              <div className="mt-6 flex items-center gap-2">
                <span className="h-1 w-16 rounded-full bg-[#e8b830]" />
                <span className="h-1 w-3 rounded-full bg-[#e8b830]/50" />
                <span className="h-1 w-1 rounded-full bg-[#e8b830]/30" />
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-white">
                <div>
                  <p className="font-serif text-2xl font-bold leading-none">{totalForms}</p>
                  <p className="text-xs text-white/60 mt-1 tracking-wide">Formulários</p>
                </div>
                <div className="w-px h-9 bg-white/20" />
                <div>
                  <p className="font-serif text-2xl font-bold leading-none">{emAnalise}</p>
                  <p className="text-xs text-white/60 mt-1 tracking-wide">Em análise</p>
                </div>
                <div className="w-px h-9 bg-white/20" />
                <div>
                  <p className="font-serif text-2xl font-bold leading-none text-[#e8b830]">{concluidos}</p>
                  <p className="text-xs text-white/60 mt-1 tracking-wide">Concluídos</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#0d4f1a]">Produtores</h2>
              <p className="text-sm text-gray-500 mt-0.5">Registros organizados por formulário — clique em um produtor para ver todos os dados.</p>
            </div>
            <span className="inline-flex items-center gap-2 self-start lg:self-auto px-3 py-1.5 rounded-full text-xs font-semibold bg-white ring-1 ring-gray-200 text-gray-600 shadow-sm">
              {formsFiltrados.length} registro{formsFiltrados.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="bg-white rounded-3xl agro-shadow-lg ring-1 ring-gray-100 overflow-hidden">
            <div className="px-6 lg:px-8 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Filtrar</span>
              <select className="rounded-lg border border-gray-200 bg-gray-50/60 py-1.5 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/20 focus:border-[#1a5c2a] transition-all w-40" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                <option value="">Todos os estados</option>
                {estadosDisponiveis.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <select className="rounded-lg border border-gray-200 bg-gray-50/60 py-1.5 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/20 focus:border-[#1a5c2a] transition-all w-52" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                <option value="">Todos os status</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusInfo(s).label}</option>)}
              </select>
              {(filtroEstado || filtroStatus || filtroNome) && (
                <button onClick={() => { setFiltroEstado(""); setFiltroStatus(""); setFiltroNome(""); }} className="ml-auto text-xs font-semibold text-[#b8942e] hover:text-[#8a6f1f] transition-colors">
                  Limpar filtros
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="px-6 lg:px-8 py-3.5 font-semibold text-gray-400 text-[11px] tracking-[0.14em] uppercase">Produtor</th>
                    <th className="px-6 py-3.5 font-semibold text-gray-400 text-[11px] tracking-[0.14em] uppercase">Localização</th>
                    <th className="px-6 py-3.5 font-semibold text-gray-400 text-[11px] tracking-[0.14em] uppercase">Atividade</th>
                    <th className="px-6 py-3.5 font-semibold text-gray-400 text-[11px] tracking-[0.14em] uppercase">Status</th>
                    <th className="px-6 py-3.5 font-semibold text-gray-400 text-[11px] tracking-[0.14em] uppercase">Preenchimento</th>
                    <th className="px-6 py-3.5 text-right font-semibold text-gray-400 text-[11px] tracking-[0.14em] uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {formsFiltrados.map((f, i) => {
                    const st = statusInfo(f.status_preenchimento);
                    const completo = f.percentual_preenchido >= 100;
                    return (
                      <tr key={f.id} className={`group border-b border-gray-50 transition-colors hover:bg-gradient-to-r hover:from-[#f3f9f4] hover:to-transparent ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}>
                        <td className="px-6 lg:px-8 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-sm shadow-sm ring-1 ring-white shrink-0 ${completo ? 'bg-gradient-to-br from-[#1a7a2e] to-[#0d4f1a] text-white' : 'bg-gradient-to-br from-[#e8b830] to-[#d4a017] text-[#0d4f1a]'}`}>
                              {initials(f.produtores?.nome_razao)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 leading-tight truncate max-w-[220px]">{f.produtores?.nome_razao}</p>
                              <p className="text-xs text-gray-400 truncate mt-0.5">{f.produtores?.cpf_cnpj || "Documento não informado"}{f.protocolo ? ` • ${f.protocolo}` : ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {f.produtores?.municipio || "—"}{f.produtores?.estado ? `/${f.produtores.estado}` : ""}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-[#f2efe8] text-[#5d4037] ring-1 ring-[#5d4037]/10 whitespace-nowrap">
                            {f.produtores?.atividade_principal || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 whitespace-nowrap ${st.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5 min-w-[110px]">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${f.percentual_preenchido}%`, background: completo ? 'linear-gradient(90deg, #1a7a2e, #22c55e)' : 'linear-gradient(90deg, #d4a017, #e8b830)' }} />
                            </div>
                            <span className={`text-xs font-semibold tabular-nums ${completo ? 'text-emerald-600' : 'text-gray-400'}`}>{f.percentual_preenchido}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link to="/gestao/formulario/$id" params={{ id: f.id }} title="Preencher formulário"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#b8942e] bg-[#fef7e6] ring-1 ring-[#e8b830]/20 hover:bg-[#fdf0cf] hover:shadow-sm transition-all">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              Preencher
                            </Link>
                            <Link to="/gestao/$id" params={{ id: f.id }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm hover:shadow-md transition-all" style={{ background: 'linear-gradient(135deg, #0d4f1a, #1a7a2e)' }}>
                              Visualizar
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {formsFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-16">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#f2efe8] flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <p className="font-serif font-bold text-gray-700">Nenhum diagnóstico encontrado</p>
                          <p className="text-sm text-gray-400 mt-1">Crie um novo diagnóstico ou ajuste os filtros para visualizar produtores.</p>
                          <button onClick={() => setModalAberto(true)} className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md shadow-[#0d4f1a]/20 hover:shadow-lg transition-all" style={{ background: 'linear-gradient(135deg, #0d4f1a, #1a7a2e)' }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Novo Diagnóstico
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4" onClick={resetModal}>
          <div className="bg-white rounded-3xl agro-shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-7 pt-7 pb-6 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-bl from-[#e8b830]/10 to-transparent" />
              <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-gradient-to-tr from-[#0d4f1a]/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900">Novo Diagnóstico</h2>
                  <button onClick={resetModal} className="text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="space-y-5">
                  <p className="text-sm text-gray-500 leading-relaxed">Crie um novo diagnóstico e preencha o formulário diretamente no sistema.</p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Nome do produtor (opcional)</label>
                    <input className="agro-input py-2.5 px-4 text-sm w-full" value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome do produtor para referência" />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={resetModal} className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
                    <button onClick={handleCriar} disabled={criando} className="flex-1 agro-button-primary py-2.5 px-4 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                      {criando && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg>}
                      {criando ? "Criando..." : "Criar e preencher"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
