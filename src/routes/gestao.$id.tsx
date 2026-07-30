import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import type { Produtor, Formulario, Resposta, Documento, Diagnostico, Historico, Observacao } from "../lib/types";

export const Route = createFileRoute("/gestao/$id")({
  component: ProdutorPage,
});

function ProdutorPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [produtor, setProdutor] = useState<Produtor | null>(null);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [historicos, setHistoricos] = useState<Historico[]>([]);
  const [observacoes, setObservacoes] = useState<Observacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("resumo");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [novaObs, setNovaObs] = useState("");

  const abas = [
    { id: "resumo", label: "Resumo" },
    { id: "respostas", label: "Respostas" },
    { id: "documentos", label: "Documentos" },
    { id: "diagnostico", label: "Diagnóstico" },
    { id: "historico", label: "Histórico" },
    { id: "observacoes", label: "Observações" },
  ];

  useEffect(() => {
    if (!authLoading && !user) { router.navigate({ to: "/login" }); return; }
    if (user) loadData();
  }, [user, authLoading, id]);

  async function loadData() {
    setLoading(true);
    const [fData, rData, dData, diagData, hData, oData] = await Promise.all([
      supabase.from('formularios').select('*, produtores(*)').eq('id', id).single(),
      supabase.from('respostas').select('*').eq('formulario_id', id),
      supabase.from('documentos').select('*').eq('formulario_id', id),
      supabase.from('diagnosticos').select('*').eq('formulario_id', id).maybeSingle(),
      supabase.from('historico').select('*').eq('formulario_id', id).order('created_at', { ascending: false }),
      supabase.from('observacoes').select('*, autor:autor_id(nome)').eq('formulario_id', id).order('created_at', { ascending: false }),
    ]);
    if (fData.data) { setFormulario(fData.data); setProdutor(fData.data.produtores); }
    setRespostas(rData.data || []);
    setDocumentos(dData.data || []);
    setDiagnostico(diagData.data);
    setHistoricos(hData.data || []);
    setObservacoes(oData.data || []);
    setLoading(false);
  }

  async function addObservacao() {
    if (!novaObs.trim()) return;
    const { error } = await supabase.from('observacoes').insert({ formulario_id: id, autor_id: user?.id, texto: novaObs });
    if (!error) { toast.success("Observação adicionada"); setNovaObs(""); loadData(); }
  }

  async function updateDiagnostico(campo: string, valor: any) {
    if (diagnostico) {
      await supabase.from('diagnosticos').update({ [campo]: valor }).eq('id', diagnostico.id);
    } else {
      const { data } = await supabase.from('diagnosticos').insert({ formulario_id: id, [campo]: valor }).select().single();
      if (data) setDiagnostico(data);
    }
    toast.success("Diagnóstico atualizado");
    loadData();
  }

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf8f3' }}>
      <div className="w-12 h-12 rounded-full agro-gradient animate-pulse mx-auto" />
    </div>
  );

  if (!produtor) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf8f3' }}>
      <p className="text-gray-500">Produtor não encontrado</p>
    </div>
  );

  const respMap: Record<string, any> = {};
  for (const r of respostas) respMap[r.campo] = r.valor;

  return (
    <div className="min-h-screen flex" style={{ background: '#faf8f3' }}>
      <aside className={`fixed lg:sticky top-0 left-0 z-50 w-64 h-screen agro-gradient text-white transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <div><p className="font-bold text-sm">Diagnóstico</p><p className="text-xs text-white/60">Tributário do Agro</p></div>
          </div>
        </div>
        <nav className="p-4">
          <Link to="/gestao" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Voltar
          </Link>
        </nav>
      </aside>

      <div className="flex-1 min-h-screen">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <button className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <span className="text-sm font-bold" style={{ color: '#1a5c2a' }}>{produtor.nome_razao?.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">{produtor.nome_razao}</h1>
              <p className="text-xs text-gray-400">{produtor.cpf_cnpj} • {produtor.municipio}/{produtor.estado}</p>
            </div>
          </div>
        </header>

        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="p-6">
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-1 overflow-x-auto">
              {abas.map(aba => (
                <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    abaAtiva === aba.id ? 'border-b-2' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={{ borderBottomColor: abaAtiva === aba.id ? '#1a5c2a' : 'transparent', color: abaAtiva === aba.id ? '#1a5c2a' : undefined }}>
                  {aba.label}
                </button>
              ))}
            </div>
          </div>

          {abaAtiva === "resumo" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Informações do Produtor</h3>
                <dl className="space-y-3">
                  <div><dt className="text-xs text-gray-400">Nome</dt><dd className="text-sm font-medium text-gray-800">{produtor.nome_razao}</dd></div>
                  <div><dt className="text-xs text-gray-400">CPF/CNPJ</dt><dd className="text-sm text-gray-600">{produtor.cpf_cnpj}</dd></div>
                  <div><dt className="text-xs text-gray-400">Município/Estado</dt><dd className="text-sm text-gray-600">{produtor.municipio}/{produtor.estado}</dd></div>
                  <div><dt className="text-xs text-gray-400">Atividade</dt><dd className="text-sm text-gray-600">{produtor.atividade_principal}</dd></div>
                  <div><dt className="text-xs text-gray-400">Tipo</dt><dd className="text-sm text-gray-600">{produtor.tipo}</dd></div>
                </dl>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Status do Diagnóstico</h3>
                <dl className="space-y-3">
                  <div><dt className="text-xs text-gray-400">Status</dt><dd><span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{formulario?.status_preenchimento}</span></dd></div>
                  <div><dt className="text-xs text-gray-400">Preenchimento</dt><dd className="text-sm text-gray-600">{formulario?.percentual_preenchido}%</dd></div>
                  <div><dt className="text-xs text-gray-400">Protocolo</dt><dd className="text-sm font-mono text-gray-600">{formulario?.protocolo || "—"}</dd></div>
                  <div><dt className="text-xs text-gray-400">Data Envio</dt><dd className="text-sm text-gray-600">{formulario?.data_envio ? new Date(formulario.data_envio).toLocaleString('pt-BR') : "—"}</dd></div>
                </dl>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Enquadramento</h3>
                <dl className="space-y-3">
                  <div><dt className="text-xs text-gray-400">IBS/CBS</dt><dd className="text-sm font-medium text-gray-800">{diagnostico?.enquadramento_ibs_cbs || "Pendente"}</dd></div>
                  <div><dt className="text-xs text-gray-400">Nível de Risco</dt><dd><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    diagnostico?.nivel_risco === 'Baixo' ? 'bg-green-50 text-green-700' :
                    diagnostico?.nivel_risco === 'Médio' ? 'bg-yellow-50 text-yellow-700' :
                    diagnostico?.nivel_risco === 'Alto' ? 'bg-orange-50 text-orange-700' :
                    diagnostico?.nivel_risco === 'Crítico' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
                  }`}>{diagnostico?.nivel_risco || "Pendente"}</span></dd></div>
                  <div><dt className="text-xs text-gray-400">Documentos</dt><dd className="text-sm text-gray-600">{documentos.filter(d => d.status === 'pendente' || d.status === 'recebido').length} pendentes</dd></div>
                </dl>
              </div>
            </div>
          )}

          {abaAtiva === "respostas" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Respostas do Formulário</h3>
              {Object.keys(respMap).length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhuma resposta registrada.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(respMap).sort().map(([campo, valor]) => (
                    <div key={campo} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">{campo}</p>
                      <p className="text-sm font-medium text-gray-800">{String(valor)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {abaAtiva === "documentos" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Documentos</h3>
              {documentos.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum documento anexado.</p>
              ) : (
                <div className="space-y-3">
                  {documentos.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                          <svg className="w-5 h-5" style={{ color: '#1a5c2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{doc.nome_arquivo}</p>
                          <p className="text-xs text-gray-400">{doc.categoria}</p>
                        </div>
                      </div>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        doc.status === 'aprovado' ? 'bg-green-50 text-green-700' :
                        doc.status === 'rejeitado' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>{doc.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {abaAtiva === "diagnostico" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Diagnóstico IBS/CBS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="agro-label">Enquadramento</label>
                  <select className="agro-input" value={diagnostico?.enquadramento_ibs_cbs || ""}
                    onChange={e => updateDiagnostico('enquadramento_ibs_cbs', e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Contribuinte obrigatório">Contribuinte obrigatório</option>
                    <option value="Não contribuinte">Não contribuinte</option>
                    <option value="Opção voluntária">Opção voluntária</option>
                    <option value="Necessita de análise adicional">Necessita de análise adicional</option>
                  </select>
                </div>
                <div>
                  <label className="agro-label">Nível de Risco</label>
                  <select className="agro-input" value={diagnostico?.nivel_risco || ""}
                    onChange={e => updateDiagnostico('nivel_risco', e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Baixo">Baixo</option>
                    <option value="Médio">Médio</option>
                    <option value="Alto">Alto</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="agro-label">Justificativa do Enquadramento</label>
                <textarea className="agro-input" rows={3} value={diagnostico?.justificativa_enquadramento || ""}
                  onChange={e => updateDiagnostico('justificativa_enquadramento', e.target.value)} />
              </div>
              <div className="mb-4">
                <label className="agro-label">Parecer Conclusivo</label>
                <textarea className="agro-input" rows={4} value={diagnostico?.parecer_conclusivo || ""}
                  onChange={e => updateDiagnostico('parecer_conclusivo', e.target.value)} />
              </div>
            </div>
          )}

          {abaAtiva === "historico" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Histórico</h3>
              {historicos.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum registro de histórico.</p>
              ) : (
                <div className="space-y-3">
                  {historicos.map(h => (
                    <div key={h.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4" style={{ color: '#1a5c2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{h.acao}</p>
                        {h.descricao && <p className="text-xs text-gray-500 mt-0.5">{h.descricao}</p>}
                        <p className="text-xs text-gray-400 mt-1">{new Date(h.created_at || "").toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {abaAtiva === "observacoes" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Observações Internas</h3>
              <div className="flex gap-2 mb-6">
                <input className="agro-input flex-1" placeholder="Adicionar observação..." value={novaObs}
                  onChange={e => setNovaObs(e.target.value)} onKeyDown={e => e.key === 'Enter' && addObservacao()} />
                <button onClick={addObservacao} className="agro-button-primary px-4 py-2 text-sm">Adicionar</button>
              </div>
              {observacoes.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhuma observação.</p>
              ) : (
                <div className="space-y-3">
                  {observacoes.map(o => (
                    <div key={o.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-gray-800">{o.texto}</p>
                        {o.importante && <span className="text-yellow-500 text-xs ml-2">⭐</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-medium text-gray-500">{(o as any).autor?.nome || "Desconhecido"}</span>
                        <span className="text-xs text-gray-400">{new Date(o.created_at || "").toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
