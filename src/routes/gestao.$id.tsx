import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { useAuth } from "../lib/auth-context";
import {
  getFormularioCompletoById,
  salvarDiagnosticoCompleto,
  salvarObservacao,
  adicionarPendencia,
  resolverPendencia,
} from "../lib/form-service";
import { SECOES, formatValor, isSimNao, getBadgeColor, formatData, exportCSV, totalCampos } from "../lib/form-secoes";
import { toast } from "sonner";

export const Route = createFileRoute("/gestao/$id")({
  component: ProdutorPage,
});

const STATUS_PREENCHIMENTO: Record<string, { label: string; cls: string }> = {
  cadastro_criado: { label: "Cadastro criado", cls: "bg-slate-50 text-slate-600 border-slate-200" },
  link_enviado: { label: "Link enviado", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  aguardando_preenchimento: { label: "Aguardando preenchimento", cls: "bg-slate-50 text-slate-600 border-slate-200" },
  em_preenchimento: { label: "Em preenchimento", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  formulario_enviado: { label: "Formulário enviado", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  em_analise: { label: "Em análise", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  aguardando_documentos: { label: "Aguardando documentos", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  aguardando_retorno_produtor: { label: "Aguardando retorno", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  reuniao_agendada: { label: "Reunião agendada", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  diagnostico_concluido: { label: "Diagnóstico concluído", cls: "bg-green-50 text-green-700 border-green-200" },
  apresentado_ao_produtor: { label: "Apresentado ao produtor", cls: "bg-teal-50 text-teal-700 border-teal-200" },
  arquivado: { label: "Arquivado", cls: "bg-stone-50 text-stone-600 border-stone-200" },
};

const STATUS_DIAGNOSTICO: Record<string, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-gray-50 text-gray-500 border-gray-200" },
  em_andamento: { label: "Em andamento", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  concluido: { label: "Concluído", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const STATUS_DOCUMENTO: Record<string, { label: string; cls: string }> = {
  recebido: { label: "Recebido", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  em_analise: { label: "Em análise", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  aprovado: { label: "Aprovado", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejeitado: { label: "Rejeitado", cls: "bg-red-50 text-red-700 border-red-200" },
  vencido: { label: "Vencido", cls: "bg-red-50 text-red-600 border-red-200" },
  pendente: { label: "Pendente", cls: "bg-gray-50 text-gray-500 border-gray-200" },
};

const TIPOS_PENDENCIA: Record<string, string> = {
  documento: "Documento",
  informacao: "Informação",
  outro: "Outro",
};

function badge(value?: string, map?: Record<string, { label: string; cls: string }>) {
  if (!map) return null;
  const s = map[value || ""];
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${s?.cls || "bg-gray-50 text-gray-500 border-gray-200"}`}>
      {s?.label || value || "—"}
    </span>
  );
}

function highlightText(text: string, termo: string): ReactNode {
  if (!termo || !text) return text;
  const idx = text.toLowerCase().indexOf(termo.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-gray-900 rounded px-0.5">{text.slice(idx, idx + termo.length)}</mark>
      {text.slice(idx + termo.length)}
    </>
  );
}

function ProdutorPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("resumo");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [termoBusca, setTermoBusca] = useState("");
  const [secaoAtiva, setSecaoAtiva] = useState<string | null>(null);
  const [exportandoPDF, setExportandoPDF] = useState(false);

  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvandoDiag, setSalvandoDiag] = useState(false);
  const [diagForm, setDiagForm] = useState<Record<string, any>>({});
  const [acoesForm, setAcoesForm] = useState<any[]>([]);
  const [oportunidadesForm, setOportunidadesForm] = useState<any[]>([]);

  const [obsTexto, setObsTexto] = useState("");
  const [obsCategoria, setObsCategoria] = useState("");
  const [obsImportante, setObsImportante] = useState(false);
  const [salvandoObs, setSalvandoObs] = useState(false);

  const [pendDescricao, setPendDescricao] = useState("");
  const [pendTipo, setPendTipo] = useState("documento");

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    setLoading(true);
    const data = await getFormularioCompletoById(id);
    setDados(data);
    setLoading(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f2efe8' }}>
      <div className="w-12 h-12 rounded-full agro-gradient animate-pulse mx-auto" />
    </div>
  );

  if (!dados) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f2efe8' }}>
      <div className="text-center bg-white rounded-2xl agro-shadow-lg p-8 max-w-sm">
        <p className="text-gray-500 font-medium">Produtor não encontrado</p>
        <Link to="/gestao" className="mt-4 inline-block text-sm font-semibold text-[#1a5c2a] hover:underline">← Voltar à gestão</Link>
      </div>
    </div>
  );

  const { produtor, formulario, respostas, diagnostico, acoes, oportunidades, pendencias, observacoes, historico, documentos } = dados;

  const respMap: Record<string, any> = {};
  for (const r of respostas) respMap[r.campo] = r.valor;

  const totalRespondidas = SECOES.flatMap((s) => s.campos).filter((c) => respMap[c.campo] !== undefined && respMap[c.campo] !== "" && respMap[c.campo] !== null).length;
  const totalCamposCount = totalCampos();
  const pct = totalCamposCount > 0 ? Math.round((totalRespondidas / totalCamposCount) * 100) : (formulario.percentual_preenchido || 0);

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

  function iniciarEdicao() {
    setDiagForm({
      enquadramento_ibs_cbs: diagnostico?.enquadramento_ibs_cbs || "",
      nivel_risco: diagnostico?.nivel_risco || "",
      justificativa_enquadramento: diagnostico?.justificativa_enquadramento || "",
      parecer_conclusivo: diagnostico?.parecer_conclusivo || "",
      proxima_acao: diagnostico?.proxima_acao || "",
      data_diagnostico: diagnostico?.data_diagnostico ? diagnostico.data_diagnostico.substring(0, 10) : "",
      data_prevista_retorno: diagnostico?.data_prevista_retorno ? diagnostico.data_prevista_retorno.substring(0, 10) : "",
      status_diagnostico: formulario.status_diagnostico || "pendente",
    });
    setAcoesForm((acoes || []).map((a: any) => ({ descricao: a.descricao, prazo: a.prazo ? a.prazo.substring(0, 10) : "", concluida: a.concluida })));
    setOportunidadesForm((oportunidades || []).map((o: any) => ({ descricao: o.descricao, prioridade: o.prioridade })));
    setModoEdicao(true);
  }

  async function salvarDiagnostico() {
    setSalvandoDiag(true);
    try {
      await salvarDiagnosticoCompleto(
        id,
        {
          enquadramento_ibs_cbs: diagForm.enquadramento_ibs_cbs || null,
          nivel_risco: diagForm.nivel_risco || null,
          justificativa_enquadramento: diagForm.justificativa_enquadramento || null,
          parecer_conclusivo: diagForm.parecer_conclusivo || null,
          proxima_acao: diagForm.proxima_acao || null,
          data_diagnostico: diagForm.data_diagnostico ? new Date(diagForm.data_diagnostico).toISOString() : new Date().toISOString(),
          data_prevista_retorno: diagForm.data_prevista_retorno ? new Date(diagForm.data_prevista_retorno).toISOString() : null,
        },
        acoesForm.filter((a) => a.descricao.trim()),
        oportunidadesForm.filter((o) => o.descricao.trim())
      );
      toast.success("Diagnóstico salvo com sucesso!");
      setModoEdicao(false);
      await loadData();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar diagnóstico");
    }
    setSalvandoDiag(false);
  }

  async function handleNovaObservacao() {
    if (!obsTexto.trim()) return;
    setSalvandoObs(true);
    await salvarObservacao(id, user?.id, obsTexto.trim(), obsCategoria || undefined, obsImportante);
    setObsTexto("");
    setObsCategoria("");
    setObsImportante(false);
    toast.success("Observação registrada");
    await loadData();
    setSalvandoObs(false);
  }

  async function handleNovaPendencia() {
    if (!pendDescricao.trim()) return;
    await adicionarPendencia(id, pendDescricao.trim(), pendTipo);
    setPendDescricao("");
    setPendTipo("documento");
    toast.success("Pendência registrada");
    await loadData();
  }

  async function handleResolverPendencia(pendId: string) {
    await resolverPendencia(pendId);
    toast.success("Pendência resolvida");
    await loadData();
  }

  function exportarCSV() {
    const linha: Record<string, any> = {
      "Protocolo": formulario.protocolo || "",
      "Status": STATUS_PREENCHIMENTO[formulario.status_preenchimento]?.label || formulario.status_preenchimento,
      "Status diagnóstico": STATUS_DIAGNOSTICO[formulario.status_diagnostico]?.label || formulario.status_diagnostico,
      "Preenchimento (%)": pct,
      "Data de envio": formatData(formulario.data_envio),
      "Nome / Razão Social": produtor.nome_razao,
      "CPF / CNPJ": produtor.cpf_cnpj || "",
      "Tipo": produtor.tipo || "",
      "Atividade": produtor.atividade_principal || "",
      "Município / UF": `${produtor.municipio || ""}/${produtor.estado || ""}`,
      "E-mail": produtor.email || "",
      "Telefone": produtor.telefone || "",
      "WhatsApp": produtor.whatsapp || "",
    };
    for (const sec of SECOES) {
      for (const c of sec.campos) {
        const v = respMap[c.campo];
        linha[`${sec.titulo} • ${c.label}`] = v === undefined || v === null ? "" : formatValor(v, c.format) ?? v;
      }
    }
    if (diagnostico) {
      linha["Diagnóstico • Enquadramento IBS/CBS"] = diagnostico.enquadramento_ibs_cbs || "";
      linha["Diagnóstico • Nível de risco"] = diagnostico.nivel_risco || "";
      linha["Diagnóstico • Justificativa"] = diagnostico.justificativa_enquadramento || "";
      linha["Diagnóstico • Parecer conclusivo"] = diagnostico.parecer_conclusivo || "";
      linha["Diagnóstico • Próxima ação"] = diagnostico.proxima_acao || "";
      linha["Diagnóstico • Data"] = formatData(diagnostico.data_diagnostico);
    }
    acoes.forEach((a: any, i: number) => { linha[`Ação prioritária ${i + 1}`] = a.descricao; });
    oportunidades.forEach((o: any, i: number) => { linha[`Oportunidade ${i + 1}`] = `${o.descricao}${o.prioridade ? ` (${o.prioridade})` : ""}`; });
    pendencias.forEach((p: any, i: number) => { linha[`Pendência ${i + 1}`] = `${p.descricao} [${p.resolvida ? "resolvida" : "pendente"}]`; });
    observacoes.forEach((o: any, i: number) => { linha[`Observação ${i + 1}`] = o.texto; });

    exportCSV([linha], `produtor-${produtor.nome_razao?.replace(/\s+/g, "-").toLowerCase() || "sem-nome"}.csv`);
    toast.success("CSV exportado");
  }

  async function exportarPDF() {
    setExportandoPDF(true);
    try {
      const { gerarPDF } = await import("../lib/pdf-service");
      gerarPDF({ produtor, formulario, respostas: respMap, diagnostico });
      toast.success("PDF gerado");
    } catch {
      toast.error("Erro ao gerar PDF");
    }
    setExportandoPDF(false);
  }

  const abas = [
    { id: "resumo", label: "Resumo" },
    { id: "dados", label: "Dados do Formulário" },
    { id: "documentos", label: `Documentos${documentos.length > 0 ? ` (${documentos.length})` : ""}` },
    { id: "diagnostico", label: "Diagnóstico" },
    { id: "registros", label: "Histórico e Observações" },
  ];

  const statusPreenchimentoBadge = badge(formulario.status_preenchimento, STATUS_PREENCHIMENTO);
  const statusDiagnosticoBadge = badge(formulario.status_diagnostico, STATUS_DIAGNOSTICO);

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
          <nav className="relative p-4 space-y-1 overflow-y-auto">
            <Link to="/gestao" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/60 hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span className="text-sm">Voltar à gestão</span>
            </Link>
            <div className="pt-4 border-t border-white/10">
              <p className="px-4 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Aba</p>
              {abas.filter(a => a.id !== "resumo").map(aba => (
                <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
                  className={`flex items-center gap-3 w-full px-4 py-2 rounded-xl transition-colors text-left ${abaAtiva === aba.id ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:bg-white/10'}`}>
                  <span className="text-sm truncate">{aba.label}</span>
                </button>
              ))}
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="px-4 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Seções do formulário</p>
              {SECOES.map(sec => {
                const preenchidos = sec.campos.filter(c => respMap[c.campo] !== undefined && respMap[c.campo] !== "" && respMap[c.campo] !== null).length;
                return (
                  <button key={sec.id} onClick={() => { setAbaAtiva("resumo"); setSecaoAtiva(sec.id); setTimeout(() => document.getElementById(`sec-${sec.id}`)?.scrollIntoView({ behavior: 'smooth' }), 50); }}
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
        <header className="bg-white/85 backdrop-blur-xl border-b border-gray-200/60 px-6 lg:px-8 py-3.5 sticky top-0 z-40">
          <div className="flex flex-wrap items-center gap-3">
            <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-serif font-bold text-sm text-white shadow-md ring-1 ring-white/60 shrink-0 bg-gradient-to-br from-[#1a7a2e] to-[#0d4f1a]">{produtor.nome_razao?.charAt(0)}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight truncate">{produtor.nome_razao}</h1>
                {statusPreenchimentoBadge}
                {statusDiagnosticoBadge}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {produtor.cpf_cnpj || "Documento não informado"}
                {produtor.municipio ? ` • ${produtor.municipio}/${produtor.estado}` : ""}
                {formulario.protocolo ? ` • ${formulario.protocolo}` : ""}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden sm:block">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Pesquisar em todos os dados..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
                  className="w-44 lg:w-56 pl-9 pr-8 py-1.5 text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/20 focus:border-[#1a5c2a] focus:bg-white transition-all" />
                {termoBusca && (
                  <button onClick={() => setTermoBusca("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              <button onClick={exportarCSV} title="Exportar CSV"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-50 ring-1 ring-gray-200 hover:bg-gray-100 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                CSV
              </button>
              <button onClick={exportarPDF} disabled={exportandoPDF} title="Exportar PDF"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-60 transition-all" style={{ background: 'linear-gradient(135deg, #0d4f1a, #1a7a2e)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                {exportandoPDF ? "Gerando..." : "PDF"}
              </button>
            </div>
            <div className="w-full flex items-center gap-2 text-xs sm:w-auto">
              <span className="text-gray-400 whitespace-nowrap">Preenchimento:</span>
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#0d4f1a] to-[#22c55e] transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="font-semibold text-gray-600 tabular-nums">{pct}%</span>
            </div>
          </div>
        </header>

        {sidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="p-6 lg:p-8 max-w-6xl mx-auto">
          <div className="border-b border-gray-200/80 mb-6 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {abas.map(aba => (
                <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all relative ${abaAtiva === aba.id ? 'text-[#1a5c2a]' : 'text-gray-500 hover:text-gray-700'}`}>
                  {aba.label}
                  {abaAtiva === aba.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a5c2a] rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {abaAtiva === "resumo" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
                {[
                  { label: "Tipo", value: produtor.tipo || "—", icon: "👤" },
                  { label: "Atividade", value: produtor.atividade_principal || "—", icon: "🚜" },
                  { label: "Receita bruta 2026", value: formatValor(respMap.etapa2_receita_2026, "currency") || "—", icon: "📊" },
                  { label: "Enquadramento IBS/CBS", value: diagnostico?.enquadramento_ibs_cbs || "—", icon: "📋" },
                  { label: "Nível de risco", value: diagnostico?.nivel_risco || "—", icon: "⚠️" },
                  { label: "Campos preenchidos", value: `${totalRespondidas}/${totalCamposCount}`, icon: "✅" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl agro-shadow-sm border border-gray-100 p-4 card-hover">
                    <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-1.5 truncate">{s.label}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{s.icon}</span>
                      <p className="text-sm font-bold text-gray-800 truncate">{s.value}</p>
                    </div>
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
                        <h3 className="font-semibold text-gray-900 truncate">{highlightText(sec.titulo, termoBusca)}</h3>
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
                              const simNao = isSimNao(respMap[c.campo]);
                              return (
                                <div key={c.campo} className="py-1.5">
                                  <p className="text-xs text-gray-400 mb-0.5">{highlightText(c.label, termoBusca)}</p>
                                  {simNao ? (
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(String(respMap[c.campo]))}`}>{highlightText(valor, termoBusca)}</span>
                                  ) : (
                                    <p className="text-sm font-medium text-gray-800">{highlightText(valor, termoBusca)}</p>
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

          {abaAtiva === "dados" && (
            <div className="space-y-6">
              {SECOES.filter(sec => matchSecao(sec)).map(sec => {
                const preenchidos = sec.campos.filter(c => respMap[c.campo] !== undefined && respMap[c.campo] !== "" && respMap[c.campo] !== null).length;
                const camposFiltrados = termo ? sec.campos.filter(matchField) : sec.campos;
                return (
                  <div key={sec.id} className="bg-white rounded-2xl agro-shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{sec.icone}</span>
                        <h3 className="font-semibold text-gray-900">{highlightText(sec.titulo, termoBusca)}</h3>
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
                                <td className="px-5 py-3 text-gray-600 font-medium">{highlightText(c.label, termoBusca)}</td>
                                <td className="px-5 py-3">
                                  {valor ? (
                                    isSimNao(respMap[c.campo]) ? (
                                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(String(respMap[c.campo]))}`}>{highlightText(valor, termoBusca)}</span>
                                    ) : (
                                      <span className="text-gray-800 font-medium">{highlightText(valor, termoBusca)}</span>
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

          {abaAtiva === "documentos" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl agro-shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Documentos anexados</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{documentos.length} documento(s) registrado(s)</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 px-3 py-1 rounded-full">Banco de dados</span>
                </div>
                {documentos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/80">
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Arquivo</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Recebido em</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documentos.map((d: any, i: number) => (
                          <tr key={d.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} border-t border-gray-50`}>
                            <td className="px-5 py-3 font-medium text-gray-700">{d.categoria || "—"}</td>
                            <td className="px-5 py-3 text-gray-800">{d.nome_arquivo}</td>
                            <td className="px-5 py-3">{badge(d.status, STATUS_DOCUMENTO)}</td>
                            <td className="px-5 py-3 text-gray-500">{formatData(d.created_at)}</td>
                            <td className="px-5 py-3">
                              {d.url && (
                                <a href={d.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#1a5c2a] hover:underline">Abrir arquivo</a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-5 py-12 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f2efe8] flex items-center justify-center mb-3">
                      <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </div>
                    <p className="font-semibold text-gray-700">Nenhum documento anexado</p>
                    <p className="text-sm text-gray-400 mt-1">Os documentos enviados pelo produtor aparecerão aqui.</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl agro-shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Documentos recomendados</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Lista de documentos esperados para análise completa</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
                  {["Cartão do CNPJ", "CPF e documento de identificação", "Inscrição estadual", "Comprovante do CAEPF", "Declaração do Imposto de Renda", "LCDPR", "Livro Caixa", "Notas fiscais", "Contratos de arrendamento", "Contratos de compra e venda", "Documentos dos imóveis rurais", "ITR", "CCIR", "CAR", "Certidões", "Comprovantes de financiamentos"].map(cat => {
                    const recebido = documentos.some((d: any) => d.categoria === cat);
                    return (
                      <div key={cat} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${recebido ? 'border-emerald-200 bg-emerald-50/60' : 'border-gray-200 bg-gray-50/50'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 ${recebido ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                          {recebido && <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </span>
                        <span className={`text-xs font-medium ${recebido ? 'text-emerald-700' : 'text-gray-500'}`}>{cat}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {abaAtiva === "diagnostico" && (
            <div className="bg-white rounded-2xl agro-shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Classificação Final do Diagnóstico</h3>
                  <p className="text-sm text-gray-500 mt-1">Enquadramento IBS/CBS, risco e plano de ação do produtor</p>
                </div>
                {!modoEdicao && (
                  <button onClick={iniciarEdicao} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm hover:shadow-md transition-all" style={{ background: 'linear-gradient(135deg, #0d4f1a, #1a7a2e)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Editar diagnóstico
                  </button>
                )}
              </div>

              {modoEdicao ? (
                <div className="p-6 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Enquadramento IBS/CBS</label>
                      <select className="agro-input w-full" value={diagForm.enquadramento_ibs_cbs || ""} onChange={e => setDiagForm({ ...diagForm, enquadramento_ibs_cbs: e.target.value })}>
                        <option value="">Selecione...</option>
                        <option>Contribuinte obrigatório</option>
                        <option>Não contribuinte</option>
                        <option>Opção voluntária</option>
                        <option>Necessita de análise adicional</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Nível de risco</label>
                      <select className="agro-input w-full" value={diagForm.nivel_risco || ""} onChange={e => setDiagForm({ ...diagForm, nivel_risco: e.target.value })}>
                        <option value="">Selecione...</option>
                        <option>Baixo</option>
                        <option>Médio</option>
                        <option>Alto</option>
                        <option>Crítico</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Justificativa do enquadramento</label>
                    <textarea className="agro-input w-full min-h-[90px]" value={diagForm.justificativa_enquadramento || ""} onChange={e => setDiagForm({ ...diagForm, justificativa_enquadramento: e.target.value })} placeholder="Fundamentação da classificação..." />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Parecer conclusivo</label>
                    <textarea className="agro-input w-full min-h-[120px]" value={diagForm.parecer_conclusivo || ""} onChange={e => setDiagForm({ ...diagForm, parecer_conclusivo: e.target.value })} placeholder="Parecer técnico completo..." />
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 block">Ações prioritárias</label>
                    <div className="space-y-2.5">
                      {acoesForm.map((a, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input className="agro-input flex-1" placeholder={`Ação prioritária ${i + 1}...`} value={a.descricao} onChange={e => { const novo = [...acoesForm]; novo[i] = { ...novo[i], descricao: e.target.value }; setAcoesForm(novo); }} />
                          <input className="agro-input w-36" type="date" value={a.prazo || ""} onChange={e => { const novo = [...acoesForm]; novo[i] = { ...novo[i], prazo: e.target.value }; setAcoesForm(novo); }} />
                          <label className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                            <input type="checkbox" checked={!!a.concluida} onChange={e => { const novo = [...acoesForm]; novo[i] = { ...novo[i], concluida: e.target.checked }; setAcoesForm(novo); }} className="w-4 h-4" style={{ accentColor: '#1a5c2a' }} />
                            Concluída
                          </label>
                          <button onClick={() => setAcoesForm(acoesForm.filter((_, x) => x !== i))} className="text-gray-300 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                      <button onClick={() => setAcoesForm([...acoesForm, { descricao: "", prazo: "", concluida: false }])} className="text-xs font-semibold text-[#1a5c2a] hover:underline">
                        + Adicionar ação prioritária
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 block">Oportunidades de novos serviços</label>
                    <div className="space-y-2.5">
                      {oportunidadesForm.map((o, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input className="agro-input flex-1" placeholder={`Oportunidade ${i + 1}...`} value={o.descricao} onChange={e => { const novo = [...oportunidadesForm]; novo[i] = { ...novo[i], descricao: e.target.value }; setOportunidadesForm(novo); }} />
                          <select className="agro-input w-36" value={o.prioridade || "media"} onChange={e => { const novo = [...oportunidadesForm]; novo[i] = { ...novo[i], prioridade: e.target.value }; setOportunidadesForm(novo); }}>
                            <option value="alta">Alta</option>
                            <option value="media">Média</option>
                            <option value="baixa">Baixa</option>
                          </select>
                          <button onClick={() => setOportunidadesForm(oportunidadesForm.filter((_, x) => x !== i))} className="text-gray-300 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                      <button onClick={() => setOportunidadesForm([...oportunidadesForm, { descricao: "", prioridade: "media" }])} className="text-xs font-semibold text-[#1a5c2a] hover:underline">
                        + Adicionar oportunidade
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-gray-100 pt-6">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Data do diagnóstico</label>
                      <input className="agro-input w-full" type="date" value={diagForm.data_diagnostico || ""} onChange={e => setDiagForm({ ...diagForm, data_diagnostico: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Data prevista de retorno</label>
                      <input className="agro-input w-full" type="date" value={diagForm.data_prevista_retorno || ""} onChange={e => setDiagForm({ ...diagForm, data_prevista_retorno: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Próxima ação</label>
                      <input className="agro-input w-full" value={diagForm.proxima_acao || ""} onChange={e => setDiagForm({ ...diagForm, proxima_acao: e.target.value })} placeholder="Próximo passo do atendimento" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Status do diagnóstico</label>
                      <select className="agro-input w-full" value={diagForm.status_diagnostico || "pendente"} onChange={e => setDiagForm({ ...diagForm, status_diagnostico: e.target.value })}>
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em andamento</option>
                        <option value="concluido">Concluído</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <button onClick={() => setModoEdicao(false)} className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
                    <button onClick={salvarDiagnostico} disabled={salvandoDiag} className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white shadow-md disabled:opacity-60 flex items-center justify-center gap-2 transition-all" style={{ background: 'linear-gradient(135deg, #0d4f1a, #1a7a2e)' }}>
                      {salvandoDiag && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg>}
                      {salvandoDiag ? "Salvando..." : "Salvar diagnóstico"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-8">
                  {diagnostico ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { label: "Enquadramento IBS/CBS", value: diagnostico.enquadramento_ibs_cbs, icon: "📋", color: "text-[#1a5c2a]" },
                          { label: "Nível de risco", value: diagnostico.nivel_risco, icon: "⚠️", color: diagnostico.nivel_risco === "Crítico" || diagnostico.nivel_risco === "Alto" ? "text-red-600" : "text-amber-600" },
                          { label: "Status", value: STATUS_DIAGNOSTICO[formulario.status_diagnostico]?.label || formulario.status_diagnostico, icon: "✅", color: "text-gray-800" },
                        ].map(s => (
                          <div key={s.label} className="rounded-2xl border border-gray-100 bg-[#faf9f5] p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{s.label}</p>
                            <p className={`text-lg font-bold ${s.color}`}>{s.value || "—"}</p>
                          </div>
                        ))}
                      </div>
                      {diagnostico.justificativa_enquadramento && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Justificativa do enquadramento</h4>
                          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">{diagnostico.justificativa_enquadramento}</p>
                        </div>
                      )}
                      {diagnostico.parecer_conclusivo && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Parecer conclusivo</h4>
                          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">{diagnostico.parecer_conclusivo}</p>
                        </div>
                      )}
                      {(acoes.length > 0 || oportunidades.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {acoes.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ações prioritárias</h4>
                              <ul className="space-y-2">
                                {acoes.map((a: any) => (
                                  <li key={a.id} className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-white p-3">
                                    <span className={`w-4 h-4 mt-0.5 rounded-full flex items-center justify-center text-white shrink-0 ${a.concluida ? 'bg-emerald-500' : 'bg-[#e8b830]'}`}>
                                      {a.concluida && <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </span>
                                    <div>
                                      <p className="text-sm text-gray-800">{a.descricao}</p>
                                      {a.prazo && <p className="text-xs text-gray-400 mt-0.5">Prazo: {formatData(a.prazo)}</p>}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {oportunidades.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Oportunidades de serviços</h4>
                              <ul className="space-y-2">
                                {oportunidades.map((o: any) => (
                                  <li key={o.id} className="rounded-xl border border-gray-100 bg-white p-3 flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${o.prioridade === 'alta' ? 'bg-red-500' : o.prioridade === 'media' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                    <p className="text-sm text-gray-800">{o.descricao}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm border-t border-gray-100 pt-4">
                        <div><span className="text-gray-400">Data do diagnóstico: </span><span className="font-medium text-gray-700">{formatData(diagnostico.data_diagnostico)}</span></div>
                        <div><span className="text-gray-400">Retorno previsto: </span><span className="font-medium text-gray-700">{formatData(diagnostico.data_prevista_retorno)}</span></div>
                        <div><span className="text-gray-400">Próxima ação: </span><span className="font-medium text-gray-700">{diagnostico.proxima_acao || "—"}</span></div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f2efe8] flex items-center justify-center mb-3">
                        <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <p className="font-semibold text-gray-700">Diagnóstico ainda não elaborado</p>
                      <p className="text-sm text-gray-400 mt-1 mb-5">Defina o enquadramento, o nível de risco e o plano de ação.</p>
                      <button onClick={iniciarEdicao} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all" style={{ background: 'linear-gradient(135deg, #0d4f1a, #1a7a2e)' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Elaborar diagnóstico
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {abaAtiva === "registros" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl agro-shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Observações internas</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Anotações da equipe sobre o atendimento</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 px-3 py-1 rounded-full">{observacoes.length} registro(s)</span>
                </div>
                <div className="p-5 border-b border-gray-50">
                  <textarea className="agro-input w-full min-h-[80px]" value={obsTexto} onChange={e => setObsTexto(e.target.value)} placeholder="Escreva uma observação sobre este produtor..." />
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <select className="agro-input w-48" value={obsCategoria} onChange={e => setObsCategoria(e.target.value)}>
                      <option value="">Sem categoria</option>
                      <option>Reunião</option>
                      <option>Ligação</option>
                      <option>Documentação</option>
                      <option>Fiscal</option>
                      <option>Comercial</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                      <input type="checkbox" checked={obsImportante} onChange={e => setObsImportante(e.target.checked)} className="w-4 h-4" style={{ accentColor: '#1a5c2a' }} />
                      Marcar como importante
                    </label>
                    <button onClick={handleNovaObservacao} disabled={salvandoObs || !obsTexto.trim()} className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50 transition-all" style={{ background: 'linear-gradient(135deg, #0d4f1a, #1a7a2e)' }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Adicionar observação
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {observacoes.length > 0 ? (
                    observacoes.map((o: any) => (
                      <div key={o.id} className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${o.importante ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                            {o.importante ? "Importante" : "Observação"}
                          </span>
                          {o.categoria && <span className="text-xs text-gray-400">{o.categoria}</span>}
                          <span className="text-xs text-gray-400 ml-auto">{formatData(o.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">{o.texto}</p>
                        {o.usuarios && <p className="text-xs text-gray-400 mt-1.5">por {o.usuarios.nome}</p>}
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-10 text-center text-sm text-gray-400 italic">Nenhuma observação registrada ainda.</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl agro-shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Pendências</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Itens aguardando resolução no atendimento</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 px-3 py-1 rounded-full">{pendencias.filter((p: any) => !p.resolvida).length} aberta(s)</span>
                </div>
                <div className="p-5 border-b border-gray-50">
                  <div className="flex flex-wrap items-center gap-3">
                    <input className="agro-input flex-1 min-w-[200px]" value={pendDescricao} onChange={e => setPendDescricao(e.target.value)} placeholder="Descrição da pendência..." />
                    <select className="agro-input w-44" value={pendTipo} onChange={e => setPendTipo(e.target.value)}>
                      {Object.entries(TIPOS_PENDENCIA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button onClick={handleNovaPendencia} disabled={!pendDescricao.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50 transition-all" style={{ background: 'linear-gradient(135deg, #0d4f1a, #1a7a2e)' }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Adicionar
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {pendencias.length > 0 ? (
                    pendencias.map((p: any) => (
                      <div key={p.id} className={`px-5 py-4 flex items-center gap-3 ${p.resolvida ? 'opacity-60' : ''}`}>
                        <button onClick={() => handleResolverPendencia(p.id)} title={p.resolvida ? "Pendência resolvida" : "Marcar como resolvida"}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${p.resolvida ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-400'}`}>
                          {p.resolvida && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${p.resolvida ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{p.descricao}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{TIPOS_PENDENCIA[p.tipo] || p.tipo} • {formatData(p.created_at)}</p>
                        </div>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${p.resolvida ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {p.resolvida ? "Resolvida" : "Pendente"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-10 text-center text-sm text-gray-400 italic">Nenhuma pendência registrada.</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl agro-shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Histórico de atividades</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Linha do tempo de todas as ações neste formulário</p>
                </div>
                {historico.length > 0 ? (
                  <div className="p-5">
                    <ol className="relative border-l border-gray-100 ml-3 space-y-6">
                      {historico.map((h: any) => (
                        <li key={h.id} className="ml-6">
                          <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-white border-2 border-[#1a5c2a]" />
                          <p className="text-sm font-semibold text-gray-800">{h.acao}</p>
                          {h.descricao && <p className="text-sm text-gray-500 mt-0.5">{h.descricao}</p>}
                          <p className="text-xs text-gray-400 mt-1">{formatData(h.created_at)}{h.usuarios?.nome ? ` • ${h.usuarios.nome}` : ""}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <div className="px-5 py-10 text-center text-sm text-gray-400 italic">Nenhuma atividade registrada no histórico.</div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
