import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { supabase } from "../lib/supabase";
import { getFormulariosCompletos, getEstatisticas } from "../lib/form-service";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/gestao/")({
  component: GestaoPage,
});

interface FormComProdutor {
  id: string; produtor_id: string; status_preenchimento: string; status_diagnostico: string;
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

  useEffect(() => {
    if (!authLoading && !user) { router.navigate({ to: "/login" }); return; }
    if (user) loadData();
  }, [user, authLoading]);

  async function loadData() {
    setLoading(true);
    const [formsData, stats] = await Promise.all([getFormulariosCompletos(), getEstatisticas()]);
    setForms(formsData as FormComProdutor[]);
    setEstatisticas(stats);
    setLoading(false);
  }

  async function copyLink(formId: string) {
    const { data } = await supabase.from('formularios').select('link_id').eq('id', formId).single();
    if (data) {
      const { data: link } = await supabase.from('links_formulario').select('codigo').eq('id', data.link_id).single();
      if (link) {
        await navigator.clipboard.writeText(`${window.location.origin}/formulario/${link.codigo}`);
        toast.success("Link copiado!");
      }
    }
  }

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf8f3' }}>
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
    <div className="min-h-screen flex" style={{ background: '#faf8f3' }}>
      <aside className={`fixed lg:sticky top-0 left-0 z-50 w-64 h-screen agro-gradient text-white transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div><p className="font-bold text-sm">Diagnóstico</p><p className="text-xs text-white/60">Tributário do Agro</p></div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{user?.nome?.charAt(0)}</div>
            <div><p className="text-xs font-medium">{user?.nome}</p><p className="text-xs text-white/60">{user?.cargo}</p></div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <a href="/gestao" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-white font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Gestão dos Diagnósticos
          </a>
          <a href="/gestao" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Configurações</a>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button onClick={() => signOut()} className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 w-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 min-h-screen">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between lg:justify-end sticky top-0 z-40">
          <button className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="relative">
            <input className="agro-input py-2 pl-9 pr-4 text-sm w-64" placeholder="Buscar produtor..." value={filtroNome} onChange={e => setFiltroNome(e.target.value)} />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </header>

        <main className="p-6">
          {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Gestão dos Diagnósticos</h1>
            <p className="text-gray-500 text-sm mt-1">Acompanhe e gerencie todos os diagnósticos tributários</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {statsCards.map(s => (
              <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Formulários por Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis /><Tooltip />
                  <Bar dataKey="value" fill="#1a5c2a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Produtores por Estado</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={estadoChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{estadoChartData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Produtores por Atividade</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={atividadeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{atividadeChartData.map((_,i) => <Cell key={i} fill={COLORS[(i+2)%COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Faixa de Receita</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={receitaChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{receitaChartData.map((_,i) => <Cell key={i} fill={i===0?'#4caf50':'#c9a84c'} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
              <select className="agro-input py-2 px-3 text-sm w-40" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                <option value="">Todos estados</option>
                {Object.keys(estatisticas.porEstado || {}).map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <select className="agro-input py-2 px-3 text-sm w-48" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                <option value="">Todos status</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Nome</th>
                    <th className="px-4 py-3 font-medium text-gray-600">CPF/CNPJ</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Estado</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Atividade</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600">%</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {formsFiltrados.map(f => (
                    <tr key={f.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{f.produtores?.nome_razao}</td>
                      <td className="px-4 py-3 text-gray-500">{f.produtores?.cpf_cnpj}</td>
                      <td className="px-4 py-3 text-gray-500">{f.produtores?.estado}</td>
                      <td className="px-4 py-3 text-gray-500">{f.produtores?.atividade_principal}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          f.status_preenchimento === 'formulario_enviado' ? 'bg-green-50 text-green-700' :
                          f.status_preenchimento === 'em_analise' ? 'bg-yellow-50 text-yellow-700' :
                          f.status_preenchimento === 'diagnostico_concluido' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'
                        }`}>{STATUS_LABELS[f.status_preenchimento] || f.status_preenchimento}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${f.percentual_preenchido}%`, background: f.percentual_preenchido === 100 ? '#4caf50' : '#c9a84c' }} />
                          </div>
                          <span className="text-xs text-gray-400">{f.percentual_preenchido}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/gestao/${f.id}`} className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors" style={{ color: '#1a5c2a', background: '#e8f5e9' }}>Visualizar</Link>
                      </td>
                    </tr>
                  ))}
                  {formsFiltrados.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Nenhum formulário encontrado</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
