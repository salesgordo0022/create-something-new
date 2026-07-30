import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { supabase } from "../lib/supabase";
import { getFormulariosCompletos, getEstatisticas, criarProdutorELink, getCodigoByFormId } from "../lib/form-service";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/gestao/")({
  component: GestaoPage,
});

interface FormComProdutor {
  id: string; produtor_id: string; link_id?: string; status_preenchimento: string; status_diagnostico: string;
  percentual_preenchido: number; protocolo?: string; data_envio?: string;
  produtores: { nome_razao: string; cpf_cnpj?: string; municipio?: string; estado?: string; atividade_principal?: string; tipo?: string };
}

const COLORS = ['#1a5c2a', '#4caf50', '#c9a84c', '#5d4037', '#81c784', '#a5d6a7', '#f5e6b8', '#dc2626'];
const STATUS_OPTIONS = ['cadastro_criado','link_enviado','aguardando_preenchimento','em_preenchimento','formulario_enviado','em_analise','aguardando_documentos','aguardando_retorno_produtor','reuniao_agendada','diagnostico_concluido','apresentado_ao_produtor','arquivado'];
const STATUS_LABELS: Record<string, string> = {
  cadastro_criado: 'Cadastro Criado', link_enviado: 'Link Enviado', aguardando_preenchimento: 'Aguardando Preenchimento',
  em_preenchimento: 'Em Preenchimento', formulario_enviado: 'Formulário Enviado', em_analise: 'Em Análise',
  aguardando_documentos: 'Aguardando Documentos', aguardando_retorno_produtor: 'Aguardando Retorno',
  reuniao_agendada: 'Reunião Agendada', diagnostico_concluido: 'Diagnóstico Concluído',
  apresentado_ao_produtor: 'Apresentado ao Produtor', arquivado: 'Arquivado',
};

function GestaoPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [forms, setForms] = useState<FormComProdutor[]>([]);
  const [estatisticas, setEstatisticas] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [criando, setCriando] = useState(false);
  const [linkGerado, setLinkGerado] = useState("");
  const [novoNome, setNovoNome] = useState("");

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    const [formsData, stats] = await Promise.all([getFormulariosCompletos(), getEstatisticas()]);
    setForms(formsData as FormComProdutor[]);
    setEstatisticas(stats);
    setLoading(false);
  }

  async function handleCriar() {
    setCriando(true);
    try {
      const result = await criarProdutorELink({ nome_razao: novoNome || "Produtor" });
      const link = `${window.location.origin}/formulario/${result.codigo}`;
      setLinkGerado(link);
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado!");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar");
    }
    setCriando(false);
  }

  async function copyLink(formId: string, produtorId: string) {
    const codigo = await getCodigoByFormId(formId, produtorId);
    if (codigo) {
      const link = `${window.location.origin}/formulario/${codigo}`;
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado!");
    } else {
      toast.error("Link não encontrado");
    }
  }

  function resetModal() {
    setModalAberto(false);
    setLinkGerado("");
    setNovoNome("");
  }

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f2efe8' }}>
      <div className="text-center"><div className="w-12 h-12 rounded-full agro-gradient animate-pulse mx-auto" /><p className="mt-4 text-gray-500">Carregando...</p></div>
    </div>
  );

  const formsFiltrados = forms.filter(f => {
    if (filtroNome && !f.produtores?.nome_razao?.toLowerCase().includes(filtroNome.toLowerCase())) return false;
    if (filtroEstado && f.produtores?.estado !== filtroEstado) return false;
    if (filtroStatus && f.status_preenchimento !== filtroStatus) return false;
    return true;
  });

  const statsCards = [
    { label: "Total de Formulários", value: estatisticas.total || 0, color: "text-blue-600" },
    { label: "Enviados", value: estatisticas.porStatus?.formulario_enviado || 0, color: "text-green-600" },
    { label: "Em Análise", value: estatisticas.porStatus?.em_analise || 0, color: "text-yellow-600" },
    { label: "Diagnósticos Concluídos", value: estatisticas.porStatus?.diagnostico_concluido || 0, color: "text-emerald-600" },
    { label: "Acima de R$ 3,6M", value: estatisticas.acima3600 || 0, color: "text-orange-600" },
    { label: "Aguardando", value: estatisticas.porStatus?.aguardando_preenchimento || 0, color: "text-gray-600" },
  ];

  const statusChartData = Object.entries(estatisticas.porStatus || {}).map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v }));
  const estadoChartData = Object.entries(estatisticas.porEstado || {}).map(([k, v]) => ({ name: k, value: v }));
  const atividadeChartData = Object.entries(estatisticas.porAtividade || {}).map(([k, v]) => ({ name: k, value: v }));
  const receitaChartData = Object.entries(estatisticas.porReceita || {}).map(([k, v]) => ({ name: k, value: v }));

  return (
    <div className="min-h-screen flex" style={{ background: '#f2efe8' }}>
      <aside className={`fixed lg:sticky top-0 left-0 z-50 w-64 h-screen agro-gradient text-white transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl agro-gradient-warm flex items-center justify-center shadow-lg shadow-black/10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm tracking-wide">Diagnóstico</p>
              <p className="text-xs text-white/50 tracking-wide">Tributário do Agro</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2.5 bg-white/8 rounded-xl border border-white/5 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e8b830] to-[#d4a017] flex items-center justify-center text-sm font-bold text-[#0d4f1a]">{user?.nome?.charAt(0)}</div>
            <div>
              <p className="text-sm font-medium leading-tight">{user?.nome}</p>
              <p className="text-xs text-white/50">{user?.cargo}</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-0.5">
          <a href="/gestao" className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/10 text-white font-medium">
            <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Gestão
          </a>
          <a href="/gestao" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/60 hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Configurações
          </a>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button onClick={() => signOut()} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/60 hover:bg-white/5 w-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 min-h-screen">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
          <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input className="agro-input py-2 pl-9 pr-4 text-sm w-64" placeholder="Buscar produtor..." value={filtroNome} onChange={e => setFiltroNome(e.target.value)} />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button onClick={() => setModalAberto(true)} className="agro-button-primary px-4 py-2 text-sm">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Novo Diagnóstico
            </button>
          </div>
        </header>

        <main className="p-6 lg:p-10">
          {sidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

          <div className="mb-10 relative overflow-hidden rounded-2xl min-h-[180px] lg:min-h-[200px]">
            <img src="https://images.unsplash.com/photo-1585515328337-5f3eb6e2f3f3?w=1200&q=80" alt="Plantação de soja" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d4f1a]/90 via-[#0d4f1a]/60 to-transparent" />
            <div className="relative z-10 flex items-center gap-5 p-8 lg:p-10 min-h-[160px] lg:min-h-[180px]">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Gestão dos Diagnósticos</h1>
                <p className="text-white/70 text-sm lg:text-base mt-1 max-w-xl">Acompanhe e gerencie todos os diagnósticos tributários do agronegócio</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-10">
            {statsCards.map((s, i) => (
              <div key={s.label} className="bg-white rounded-2xl agro-shadow-md border border-gray-100 p-6 card-hover hover:shadow-lg hover:-translate-y-0.5 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full opacity-[0.06] transition-transform group-hover:scale-150 ${i % 2 === 0 ? 'bg-[#0d4f1a]' : 'bg-[#e8b830]'}`} />
                <p className="text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase relative">{s.label}</p>
                <p className={`text-3xl font-bold tracking-tight relative ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-2xl agro-shadow-lg border border-gray-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#0d4f1a]/5 to-transparent rounded-full -mr-10 -mt-10" />
              <h3 className="text-sm font-semibold text-gray-900 mb-5 tracking-wide relative">Formulários por Status</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis /><Tooltip />
                  <Bar dataKey="value" fill="#0d4f1a" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl agro-shadow-lg border border-gray-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#e8b830]/5 to-transparent rounded-full -mr-10 -mt-10" />
              <h3 className="text-sm font-semibold text-gray-900 mb-5 tracking-wide relative">Produtores por Estado</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart><Pie data={estadoChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{estadoChartData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl agro-shadow-lg border border-gray-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#e67e22]/5 to-transparent rounded-full -mr-10 -mt-10" />
              <h3 className="text-sm font-semibold text-gray-900 mb-5 tracking-wide relative">Produtores por Atividade</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart><Pie data={atividadeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{atividadeChartData.map((_,i) => <Cell key={i} fill={COLORS[(i+2)%COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl agro-shadow-lg border border-gray-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#5d4037]/5 to-transparent rounded-full -mr-10 -mt-10" />
              <h3 className="text-sm font-semibold text-gray-900 mb-5 tracking-wide relative">Faixa de Receita</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart><Pie data={receitaChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{receitaChartData.map((_,i) => <Cell key={i} fill={i===0?'#1a7a2e':'#e8b830'} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl agro-shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
              <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase mr-2">Filtrar</span>
              <select className="agro-input py-1.5 px-3 text-sm w-36" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                <option value="">Todos estados</option>
                {Object.keys(estatisticas.porEstado || {}).map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <select className="agro-input py-1.5 px-3 text-sm w-44" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                <option value="">Todos status</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 text-left">
                    <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs tracking-wide uppercase">Nome</th>
                    <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs tracking-wide uppercase">CPF/CNPJ</th>
                    <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs tracking-wide uppercase">Estado</th>
                    <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs tracking-wide uppercase">Atividade</th>
                    <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs tracking-wide uppercase">Status</th>
                    <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs tracking-wide uppercase">%</th>
                    <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs tracking-wide uppercase">Link</th>
                    <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs tracking-wide uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {formsFiltrados.map((f, i) => (
                    <tr key={f.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} border-t border-gray-50 hover:bg-green-50/40 transition-colors`}>
                      <td className="px-6 py-4 font-medium text-gray-900">{f.produtores?.nome_razao}</td>
                      <td className="px-6 py-4 text-gray-500">{f.produtores?.cpf_cnpj}</td>
                      <td className="px-6 py-4 text-gray-500">{f.produtores?.estado}</td>
                      <td className="px-6 py-4 text-gray-500">{f.produtores?.atividade_principal}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          f.status_preenchimento === 'formulario_enviado' ? 'bg-emerald-50 text-emerald-700' :
                          f.status_preenchimento === 'em_analise' ? 'bg-amber-50 text-amber-700' :
                          f.status_preenchimento === 'diagnostico_concluido' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>{STATUS_LABELS[f.status_preenchimento] || f.status_preenchimento}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${f.percentual_preenchido}%`, background: f.percentual_preenchido === 100 ? '#10b981' : '#c9a84c' }} />
                          </div>
                          <span className="text-xs text-gray-400 font-medium">{f.percentual_preenchido}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => copyLink(f.id, f.produtor_id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:shadow-sm" style={{ color: '#b8942e', background: '#fef7e6' }}>
                          Copiar Link
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/gestao/${f.id}`} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:shadow-sm" style={{ color: '#1a5c2a', background: '#e8f5e9' }}>Visualizar</Link>
                      </td>
                    </tr>
                  ))}
                  {formsFiltrados.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">Nenhum formulário encontrado</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={resetModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Novo Diagnóstico</h2>
              <button onClick={resetModal} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            {linkGerado ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="font-medium text-gray-800">Link gerado com sucesso!</p>
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 break-all">{linkGerado}</div>
                <p className="text-xs text-gray-400">O link foi copiado para sua área de transferência. Envie para o produtor preencher o formulário.</p>
                <button onClick={resetModal} className="agro-button px-6 py-2 text-sm">OK</button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">Gere um link para o produtor preencher o formulário de diagnóstico tributário.</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Identificação (opcional)</label>
                  <input className="agro-input py-2 px-3 text-sm w-full" value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome do produtor para referência" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={resetModal} className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleCriar} disabled={criando} className="flex-1 agro-button py-2.5 px-4 text-sm flex items-center justify-center gap-2">
                    {criando && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg>}
                    Gerar Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
