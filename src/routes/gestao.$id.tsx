import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { supabase, isConfigured } from "../lib/supabase";
import { getRespostas, getFormulariosCompletos } from "../lib/form-service";
import { toast } from "sonner";

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

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    setLoading(true);
    if (!isConfigured) {
      const forms = await getFormulariosCompletos();
      const form = (forms as any[]).find(f => f.id === id);
      if (form) {
        setProdutor({ ...form.produtores, id: form.produtor_id, status_preenchimento: form.status_preenchimento, percentual_preenchido: form.percentual_preenchido, protocolo: form.protocolo, data_envio: form.data_envio });
      } else {
        setProdutor({ nome_razao: "Produtor Demo", cpf_cnpj: "000.000.000-00", municipio: "Demo", estado: "DF", atividade_principal: "Soja", tipo: "Pessoa Física", status_preenchimento: "em_preenchimento", percentual_preenchido: 60 });
      }
      setRespostas([]);
      setLoading(false);
      return;
    }
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
  const pct = Math.round((totalRespondidas / totalCampos) * 100);

  const abas = [
    { id: "resumo", label: "Resumo" },
    { id: "respostas", label: "Respostas" },
    { id: "diagnostico", label: "Diagnóstico" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#f2efe8' }}>
      <aside className={`fixed lg:sticky top-0 left-0 z-50 w-64 h-screen agro-gradient text-white transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm tracking-wide">Diagnóstico</p>
              <p className="text-xs text-white/50 tracking-wide">Tributário do Agro</p>
            </div>
          </div>
        </div>
        <nav className="p-3">
          <Link to="/gestao" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/60 hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Voltar
          </Link>
        </nav>
      </aside>

      <div className="flex-1 min-h-screen">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
          <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full agrogradient flex items-center justify-center text-white text-sm font-bold">{produtor.nome_razao?.charAt(0)}</div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">{produtor.nome_razao}</h1>
              <p className="text-xs text-gray-500">{produtor.cpf_cnpj}{produtor.municipio ? ` • ${produtor.municipio}/${produtor.estado}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-gray-400">Preenchimento:</span>
              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#1a5c2a] to-[#4caf50] transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="font-medium text-gray-600">{pct}%</span>
            </div>
          </div>
        </header>

        {sidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="p-6 lg:p-8 max-w-6xl mx-auto">
          <div className="border-b border-gray-200/80 mb-8">
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

          {abaAtiva === "resumo" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Tipo", value: produtor.tipo, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Atividade", value: produtor.atividade_principal, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Campos Respondidos", value: `${totalRespondidos}/${totalCampos}`, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Status", value: produtor.status_preenchimento, color: "text-gray-600", bg: "bg-gray-100" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl agro-shadow-md border border-gray-100 p-5 card-hover">
                    <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-2">{s.label}</p>
                    <p className={`text-lg font-bold ${s.color}`}>{s.value || "—"}</p>
                  </div>
                ))}
              </div>

              {SECOES.map(sec => {
                const preenchidos = sec.campos.filter(c => respMap[c.campo] !== undefined && respMap[c.campo] !== "" && respMap[c.campo] !== null);
                if (preenchidos.length === 0) return null;
                return (
                  <div key={sec.id} className="bg-white rounded-2xl agro-shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                      <span className="text-lg">{sec.icone}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{sec.titulo}</h3>
                        <p className="text-xs text-gray-400">{preenchidos.length} de {sec.campos.length} respondidos</p>
                      </div>
                    </div>
                    <div className="px-6 py-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                        {sec.campos.map(c => {
                          const valor = formatValor(respMap[c.campo], c.format);
                          if (!valor) return null;
                          return (
                            <div key={c.campo}>
                              <p className="text-xs text-gray-400 mb-0.5">{c.label}</p>
                              {["SIM", "NÃO", "sim", "não", "SIM → CONTRIBUINTE", "NÃO → NÃO CONTRIBUINTE"].includes(String(respMap[c.campo])) ? (
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(String(respMap[c.campo]))}`}>{valor}</span>
                              ) : (
                                <p className="text-sm font-medium text-gray-800">{valor}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {abaAtiva === "respostas" && (
            <div className="space-y-6">
              {SECOES.map(sec => {
                const preenchidos = sec.campos.filter(c => respMap[c.campo] !== undefined && respMap[c.campo] !== "" && respMap[c.campo] !== null);
                return (
                  <div key={sec.id} className="bg-white rounded-2xl agro-shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{sec.icone}</span>
                        <h3 className="font-semibold text-gray-900">{sec.titulo}</h3>
                      </div>
                      <span className="text-xs text-gray-400">{preenchidos.length}/{sec.campos.length}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50/80">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Pergunta</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Resposta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sec.campos.map((c, i) => {
                            const valor = formatValor(respMap[c.campo], c.format);
                            return (
                              <tr key={c.campo} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} border-t border-gray-50`}>
                                <td className="px-6 py-3.5 text-gray-600 font-medium">{c.label}</td>
                                <td className="px-6 py-3.5">
                                  {valor ? (
                                    ["SIM", "NÃO", "sim", "não", "SIM → CONTRIBUINTE", "NÃO → NÃO CONTRIBUINTE"].includes(String(respMap[c.campo])) ? (
                                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(String(respMap[c.campo]))}`}>{valor}</span>
                                    ) : (
                                      <span className="text-gray-800 font-medium">{valor}</span>
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
