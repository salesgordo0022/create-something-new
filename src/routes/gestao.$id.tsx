import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { useAuth } from "../lib/auth-context";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/gestao/$id")({
  component: ProdutorPage,
});

const SECOES = [
  {
    id: "identificacao", titulo: "Identificação e Perfil", icone: "👤",
    campos: [
      { campo: "etapa1_nome", label: "Nome / Razão Social" },
      { campo: "etapa1_cpf_cnpj", label: "CPF ou CNPJ" },
      { campo: "etapa1_tipo", label: "Tipo" },
      { campo: "etapa1_atividade", label: "Atividade principal" },
      { campo: "etapa1_atividade_outra", label: "Outra atividade (descrição)" },
      { campo: "etapa1_estados_operacao", label: "Estados onde opera" },
      { campo: "etapa1_mult_estados", label: "Estabelecimentos em mais de um estado?" },
      { campo: "etapa1_possui_ie", label: "Possui Inscrição Estadual?" },
      { campo: "etapa1_ie_numero", label: "Número da IE" },
      { campo: "etapa1_possui_caepf", label: "Possui CAEPF?" },
      { campo: "etapa1_caepf_numero", label: "Número do CAEPF" },
    ],
  },
  {
    id: "financeiro", titulo: "Dados Financeiros", icone: "📊",
    campos: [
      { campo: "etapa2_receita_2024", label: "Receita bruta 2024", format: "currency" },
      { campo: "etapa2_exportacao_2024", label: "Parcela exportada 2024", format: "currency" },
      { campo: "etapa2_receita_2026", label: "Receita bruta 2026", format: "currency" },
      { campo: "etapa2_exportacao_2026", label: "Parcela exportada 2026", format: "currency" },
      { campo: "etapa2_receitas_nao_rurais", label: "Receitas não rurais?" },
      { campo: "etapa2_atividades_nao_rurais", label: "Quais atividades não rurais" },
    ],
  },
  {
    id: "operacoes", titulo: "Operações e Cadeia Produtiva", icone: "🚜",
    campos: [
      { campo: "etapa3_vende_para", label: "Vende para" },
      { campo: "etapa3_exporta", label: "Exporta diretamente?" },
      { campo: "etapa3_vende_trading", label: "Vende para trading/exportadora?" },
      { campo: "etapa3_integrado", label: "É produtor integrado?" },
      { campo: "etapa3_integrador_nome", label: "Nome do Integrador" },
      { campo: "etapa3_cooperativa", label: "Participa de cooperativa?" },
      { campo: "etapa3_cooperativa_nome", label: "Nome da Cooperativa" },
      { campo: "etapa3_nao_contribuintes", label: "Operações com não contribuintes?" },
      { campo: "etapa3_insumos", label: "Principais insumos" },
      { campo: "etapa3_fornecedores", label: "De quem adquire os insumos" },
      { campo: "etapa3_maquinas", label: "Adquire máquinas agrícolas?" },
      { campo: "etapa3_freq_aquisicoes", label: "Frequência das aquisições" },
    ],
  },
  {
    id: "fiscal", titulo: "Situação Fiscal Atual", icone: "📋",
    campos: [
      { campo: "etapa4_emite_nfe", label: "Emite NF-e nas vendas?" },
      { campo: "etapa4_software_fiscal", label: "Software de gestão fiscal" },
      { campo: "etapa4_escrituracao", label: "Tipo de escrituração" },
      { campo: "etapa4_funrural", label: "Recolhe Funrural?" },
      { campo: "etapa4_funrural_modalidade", label: "Modalidade Funrural" },
      { campo: "etapa4_fundo_estadual", label: "FETHAB/FUNDEINFRA/FUNDERSUL?" },
      { campo: "etapa4_fundo_estado", label: "Estado do fundo" },
      { campo: "etapa4_gestao_financeira", label: "Tem gestão financeira?" },
      { campo: "etapa4_outras_atividades", label: "Outras atividades comerciais?" },
      { campo: "etapa4_debitos", label: "Débitos tributários?" },
      { campo: "etapa4_parcelamentos", label: "Parcelamentos?" },
      { campo: "etapa4_certidoes", label: "Certidões negativas?" },
    ],
  },
  {
    id: "patrimonio", titulo: "Patrimônio e Estrutura", icone: "🏠",
    campos: [
      { campo: "etapa5_imovel_proprio", label: "Imóvel rural próprio?" },
      { campo: "etapa5_hectares_proprios", label: "Total de hectares próprios", format: "number" },
      { campo: "etapa5_arrendada", label: "Área arrendada?" },
      { campo: "etapa5_hectares_arrendados", label: "Hectares arrendados", format: "number" },
      { campo: "etapa5_holding", label: "Holding rural?" },
      { campo: "etapa5_holding_descricao", label: "Descrição da holding" },
      { campo: "etapa5_socios", label: "Sócios/herdeiros na atividade?" },
      { campo: "etapa5_seguro", label: "Seguro rural?" },
      { campo: "etapa5_financiamentos", label: "Financiamentos?" },
      { campo: "etapa5_contratos", label: "Contratos de venda/compra?" },
      { campo: "etapa5_sucessorio", label: "Planejamento sucessório?" },
    ],
  },
];

function formatValor(valor: any, format?: string) {
  if (valor === "" || valor === undefined || valor === null) return null;
  if (format === "currency") {
    const num = typeof valor === "string" ? parseFloat(valor.replace(/\D/g, "")) : Number(valor);
    if (isNaN(num)) return valor;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  }
  return String(valor);
}

function getBadgeColor(valor: string) {
  if (["SIM", "sim", "SIM → CONTRIBUINTE"].includes(valor)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["NÃO", "não", "NÃO → NÃO CONTRIBUINTE"].includes(valor)) return "bg-gray-50 text-gray-500 border-gray-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

function ProdutorPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [produtor, setProdutor] = useState<any>(null);
  const [respostas, setRespostas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("resumo");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [termoBusca, setTermoBusca] = useState("");
  const [secaoAtiva, setSecaoAtiva] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    setLoading(true);
    const [fData, rData] = await Promise.all([
      supabase.from('formularios').select('*, produtores(*)').eq('id', id).single(),
      supabase.from('respostas').select('*').eq('formulario_id', id),
    ]);
    if (fData.data) { setProdutor({ ...fData.data.produtores, ...fData.data }); }
    setRespostas(rData.data || []);
    setLoading(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f2efe8' }}>
      <div className="w-12 h-12 rounded-full agro-gradient animate-pulse mx-auto" />
    </div>
  );

  if (!produtor) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f2efe8' }}>
      <div className="text-center bg-white rounded-2xl agro-shadow-lg p-8 max-w-sm">
        <p className="text-gray-500 font-medium">Produtor não encontrado</p>
      </div>
    </div>
  );

  const respMap: Record<string, any> = {};
  for (const r of respostas) respMap[r.campo] = r.valor;

  const totalRespondidas = SECOES.flatMap(s => s.campos).filter(c => respMap[c.campo] !== undefined && respMap[c.campo] !== "" && respMap[c.campo] !== null).length;
  const totalCampos = SECOES.flatMap(s => s.campos).length;
  const pct = totalCampos > 0 ? Math.round((totalRespondidas / totalCampos) * 100) : 0;

  const termo = termoBusca.toLowerCase().trim();

  function matchField(c: { campo: string; label: string; format?: string }): boolean {
    if (!termo) return true;
    const valor = String(respMap[c.campo] || "").toLowerCase();
    return c.label.toLowerCase().includes(termo) || valor.includes(termo);
  }

  function matchSecao(sec: typeof SECOES[number]): boolean {
    if (!termo) return true;
    return sec.titulo.toLowerCase().includes(termo) || sec.campos.some(matchField);
  }

  function highlightText(text: string): ReactNode {
    if (!termo || !text) return text;
    const idx = text.toLowerCase().indexOf(termo);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 text-gray-900 rounded px-0.5">{text.slice(idx, idx + termo.length)}</mark>
        {text.slice(idx + termo.length)}
      </>
    );
  }

  const abas = [
    { id: "resumo", label: "Resumo" },
    { id: "respostas", label: "Respostas" },
    { id: "diagnostico", label: "Diagnóstico" },
  ];

  const statusBadge = (status?: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      concluido: { label: "Concluído", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      em_preenchimento: { label: "Em preenchimento", cls: "bg-amber-50 text-amber-700 border-amber-200" },
      pendente: { label: "Pendente", cls: "bg-gray-50 text-gray-500 border-gray-200" },
    };
    const s = map[status || ""] || { label: status || "—", cls: "bg-gray-50 text-gray-500 border-gray-200" };
    return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f2efe8' }}>
      <aside className={`fixed lg:sticky top-0 left-0 z-50 w-72 h-screen text-white transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="relative h-full flex flex-col overflow-hidden" style={{ background: 'linear-gradient(160deg, #0a3d15 0%, #0d4f1a 45%, #123b18 100%)' }}>
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
            <Link to="/gestao" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/60 hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span className="text-sm">Voltar à gestão</span>
            </Link>
            <div className="pt-4 border-t border-white/10">
              <p className="px-4 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Seções</p>
              {SECOES.map(sec => {
                const preenchidos = sec.campos.filter(c => respMap[c.campo] !== undefined && respMap[c.campo] !== "" && respMap[c.campo] !== null).length;
                const highlight = termo && matchSecao(sec);
                if (termo && !highlight) return null;
                return (
                  <button key={sec.id} onClick={() => { setSecaoAtiva(sec.id); setAbaAtiva("resumo"); document.getElementById(`sec-${sec.id}`)?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-white/60 hover:bg-white/10 transition-colors text-left">
                    <span className="text-base">{sec.icone}</span>
                    <span className="text-sm truncate">{sec.titulo}</span>
                    <span className="ml-auto text-xs text-white/30">{preenchidos}/{sec.campos.length}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>

      <div className="flex-1 min-h-screen">
        <header className="bg-white/85 backdrop-blur-xl border-b border-gray-200/60 px-6 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="hidden sm:block shrink-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 font-semibold">Diagnóstico do Produtor</p>
            </div>
          </div>
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-serif font-bold text-sm text-white shadow-md ring-1 ring-white/60 shrink-0 ${pct >= 100 ? 'bg-gradient-to-br from-[#1a7a2e] to-[#0d4f1a]' : 'bg-gradient-to-br from-[#e8b830] to-[#d4a017] text-[#0d4f1a] ring-white'}`}>{produtor.nome_razao?.charAt(0)}</div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight truncate">{produtor.nome_razao}</h1>
              <p className="text-xs text-gray-500 truncate">{produtor.cpf_cnpj}{produtor.municipio ? ` • ${produtor.municipio}/${produtor.estado}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="relative w-44 lg:w-64 hidden sm:block">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Pesquisar perguntas..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/20 focus:border-[#1a5c2a] focus:bg-white transition-all" />
              {termoBusca && (
                <button onClick={() => setTermoBusca("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs shrink-0">
            <span className="text-gray-400">Preenchimento:</span>
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#0d4f1a] to-[#22c55e] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="font-semibold text-gray-600 tabular-nums">{pct}%</span>
          </div>
        </header>

        {sidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="p-6 lg:p-8 max-w-6xl mx-auto">
          <div className="border-b border-gray-200/80 mb-6">
            <div className="flex gap-1">
              {abas.map(aba => (
                <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all relative ${
                    abaAtiva === aba.id ? 'text-[#1a5c2a]' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {aba.label}
                  {abaAtiva === aba.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a5c2a] rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {termo && (
            <div className="mb-4 text-sm text-gray-500">
              {SECOES.filter(s => matchSecao(s)).length} seção(ões) encontrada(s) para "<strong>{termoBusca}</strong>"
            </div>
          )}

          {abaAtiva === "resumo" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                {[
                  { label: "Tipo", value: produtor.tipo, color: "text-emerald-600" },
                  { label: "Atividade", value: produtor.atividade_principal, color: "text-amber-600" },
                  { label: "Campos", value: `${totalRespondidas}/${totalCampos}`, color: "text-blue-600" },
                  { label: "Status", value: produtor.status_preenchimento ? statusBadge(produtor.status_preenchimento) : "—", color: "text-gray-600" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl agro-shadow-sm border border-gray-100 p-4 card-hover">
                    <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-1.5">{s.label}</p>
                    <div className={`text-lg font-bold ${typeof s.value === 'string' ? s.color : ''}`}>{s.value || "—"}</div>
                  </div>
                ))}
              </div>

              {SECOES.filter(sec => matchSecao(sec)).map(sec => {
                const preenchidos = sec.campos.filter(c => respMap[c.campo] !== undefined && respMap[c.campo] !== "" && respMap[c.campo] !== null).length;
                const camposFiltrados = termo ? sec.campos.filter(matchField) : sec.campos;
                const temRespostaPreenchida = camposFiltrados.some(c => respMap[c.campo] !== undefined && respMap[c.campo] !== "" && respMap[c.campo] !== null);
                const expandida = secaoAtiva === sec.id || (!secaoAtiva && !termo);
                return (
                  <div key={sec.id} id={`sec-${sec.id}`} className="bg-white rounded-2xl agro-shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 card-hover">
                    <button onClick={() => setSecaoAtiva(expandida ? null : sec.id)}
                      className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left">
                      <span className="text-lg">{sec.icone}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{sec.titulo}</h3>
                        <p className="text-xs text-gray-400">{preenchidos} de {sec.campos.length} respondidos</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#1a5c2a] to-[#4caf50]" style={{ width: `${sec.campos.length > 0 ? (preenchidos / sec.campos.length) * 100 : 0}%` }} />
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandida ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    {expandida && (
                      <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                        {temRespostaPreenchida ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                            {camposFiltrados.map(c => {
                              const valor = formatValor(respMap[c.campo], c.format);
                              if (!valor) return null;
                              const isSimNao = ["SIM", "NÃO", "sim", "não", "SIM → CONTRIBUINTE", "NÃO → NÃO CONTRIBUINTE"].includes(String(respMap[c.campo]));
                              return (
                                <div key={c.campo} className="py-1.5">
                                  <p className="text-xs text-gray-400 mb-0.5">{highlightText(c.label)}</p>
                                  {isSimNao ? (
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(String(respMap[c.campo]))}`}>{highlightText(valor)}</span>
                                  ) : (
                                    <p className="text-sm font-medium text-gray-800">{highlightText(valor)}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic text-center py-4">Nenhuma resposta preenchida nesta seção</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {abaAtiva === "respostas" && (
            <div className="space-y-6">
              {SECOES.filter(sec => matchSecao(sec)).map(sec => {
                const preenchidos = sec.campos.filter(c => respMap[c.campo] !== undefined && respMap[c.campo] !== "" && respMap[c.campo] !== null).length;
                const camposFiltrados = termo ? sec.campos.filter(matchField) : sec.campos;
                return (
                  <div key={sec.id} className="bg-white rounded-2xl agro-shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{sec.icone}</span>
                        <h3 className="font-semibold text-gray-900">{sec.titulo}</h3>
                        {termo && camposFiltrados.length < sec.campos.length && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{camposFiltrados.length} resultados</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{preenchidos}/{sec.campos.length}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50/80">
                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Pergunta</th>
                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Resposta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {camposFiltrados.map((c, i) => {
                            const valor = formatValor(respMap[c.campo], c.format);
                            return (
                              <tr key={c.campo} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} border-t border-gray-50`}>
                                <td className="px-5 py-3 text-gray-600 font-medium">{highlightText(c.label)}</td>
                                <td className="px-5 py-3">
                                  {valor ? (
                                    ["SIM", "NÃO", "sim", "não", "SIM → CONTRIBUINTE", "NÃO → NÃO CONTRIBUINTE"].includes(String(respMap[c.campo])) ? (
                                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(String(respMap[c.campo]))}`}>{highlightText(valor)}</span>
                                    ) : (
                                      <span className="text-gray-800 font-medium">{highlightText(valor)}</span>
                                    )
                                  ) : (
                                    <span className="text-gray-300 italic">Não respondido</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {abaAtiva === "diagnostico" && (
            <div className="bg-white rounded-2xl agro-shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Classificação Final do Diagnóstico</h3>
                <p className="text-sm text-gray-500 mt-1">Defina o enquadramento e as ações prioritárias</p>
              </div>
              <div className="p-6 space-y-8">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Enquadramento IBS/CBS</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {["CONTRIBUINTE OBRIGATÓRIO", "NÃO CONTRIBUINTE", "OPÇÃO VOLUNTÁRIA"].map(op => (
                      <label key={op} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        respMap.etapa7_enquadramento === op ? 'border-[#1a5c2a] bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input type="radio" name="enquadramento" value={op} checked={respMap.etapa7_enquadramento === op}
                          onChange={() => {}} className="w-4 h-4 text-[#1a5c2a]" style={{ accentColor: '#1a5c2a' }} />
                        <span className="text-sm font-medium text-gray-800">{op}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 block">Ações Prioritárias Identificadas</label>
                  {[1, 2, 3].map(i => (
                    <input key={i} className="agro-input mb-2" placeholder={`Ação prioritária ${i}...`}
                      value={respMap[`etapa7_acao_${i}`] || ""} readOnly />
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 block">Oportunidades de Novos Serviços</label>
                  {[1, 2].map(i => (
                    <input key={i} className="agro-input mb-2" placeholder={`Oportunidade ${i}...`}
                      value={respMap[`etapa7_oportunidade_${i}`] || ""} readOnly />
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Data do Diagnóstico</label>
                    <input className="agro-input" type="date" value={respMap.etapa7_data_diagnostico || ""} readOnly />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Responsável</label>
                    <input className="agro-input" value={respMap.etapa7_responsavel || user?.nome || ""} readOnly />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
