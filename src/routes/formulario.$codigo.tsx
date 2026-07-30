import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getFormularioByCodigo, salvarResposta, getRespostas, enviarFormulario } from "../lib/form-service";
import { maskCpf, maskCnpj, maskPhone, maskCurrency, unmaskCurrency, isValidCpf, isValidCnpj } from "../lib/masks";
import type { Resposta, Produtor, Formulario } from "../lib/types";

export const Route = createFileRoute("/formulario/$codigo")({
  component: FormularioPage,
});

const ETAPAS = [
  { id: 1, nome: "Identificação e Perfil", icone: "👤" },
  { id: 2, nome: "Dados Financeiros e Enquadramento", icone: "📊" },
  { id: 3, nome: "Operações e Cadeia Produtiva", icone: "🚜" },
  { id: 4, nome: "Situação Fiscal Atual", icone: "📋" },
  { id: 5, nome: "Patrimônio e Estrutura", icone: "🏠" },
  { id: 6, nome: "Documentos", icone: "📎" },
  { id: 7, nome: "Revisão e Envio", icone: "✅" },
];

const ATIVIDADES = ['Soja', 'Milho', 'Pecuária', 'Leite', 'Fruticultura', 'Avicultura', 'Suinocultura', 'Outra'];
const TIPOS_PRODUTOR = ['Pessoa Física', 'Pessoa Jurídica', 'Produtor Integrado', 'Cooperativa', 'Agroindústria'];
const REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI', 'Produtor Rural PF'];
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const CATEGORIAS_DOC = ['Cartão do CNPJ','CPF e documento de identificação','Inscrição estadual','Comprovante do CAEPF','Declaração do Imposto de Renda','LCDPR','Livro Caixa','Notas fiscais','Contratos de arrendamento','Contratos de compra e venda','Documentos dos imóveis rurais','ITR','CCIR','CAR','Certidões','Comprovantes de financiamentos','Outros documentos'];

function FormularioPage() {
  const { codigo } = Route.useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [produtor, setProdutor] = useState<Produtor | null>(null);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [protocolo, setProtocolo] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    loadForm();
    const handle = setInterval(() => {
      if (formulario && Object.keys(respostas).length > 0) {
        autoSave();
      }
    }, 30000);
    return () => clearInterval(handle);
  }, []);

  async function loadForm() {
    const data = await getFormularioByCodigo(codigo);
    if (!data) {
      setErro("Link inválido ou expirado. Entre em contato com a empresa de contabilidade.");
      setLoading(false);
      return;
    }
    setProdutor(data.produtor);
    setFormulario(data.formulario);
    const respMap: Record<string, any> = {};
    for (const r of data.respostas) {
      respMap[r.campo] = r.valor;
    }
    setRespostas(respMap);
    if (data.formulario.status_preenchimento === 'formulario_enviado') {
      setEnviado(true);
      setProtocolo(data.formulario.protocolo || "");
    }
    setLoading(false);
  }

  const autoSave = useCallback(async () => {
    if (!formulario || enviado) return;
    setSalvando(true);
    for (const [campo, valor] of Object.entries(respostas)) {
      const etapa = ETAPAS.find(e => {
        if (campo.startsWith('etapa1_')) return e.id === 1;
        if (campo.startsWith('etapa2_')) return e.id === 2;
        if (campo.startsWith('etapa3_')) return e.id === 3;
        if (campo.startsWith('etapa4_')) return e.id === 4;
        if (campo.startsWith('etapa5_')) return e.id === 5;
        return false;
      });
      await salvarResposta(formulario.id, etapa?.id || 1, campo, valor);
    }
    setSalvando(false);
  }, [formulario, respostas, enviado]);

  function updateField(campo: string, valor: any) {
    setRespostas(prev => ({ ...prev, [campo]: valor }));
  }

  async function salvarEContinuar() {
    if (!formulario) return;
    setSalvando(true);
    const camposEtapa = Object.entries(respostas).filter(([k]) => {
      const e = parseInt(k.split('_')[0].replace('etapa', ''));
      return e === etapaAtual;
    });
    for (const [campo, valor] of camposEtapa) {
      await salvarResposta(formulario.id, etapaAtual, campo, valor);
    }
    setSalvando(false);
    toast.success("Salvo com sucesso!");
    if (etapaAtual < 7) setEtapaAtual(prev => prev + 1);
  }

  async function handleEnviar() {
    if (!formulario) return;
    setEnviando(true);
    try {
      const prot = await enviarFormulario(formulario.id);
      setProtocolo(prot);
      setEnviado(true);
      toast.success("Formulário enviado com sucesso!");
    } catch (err) {
      toast.error("Erro ao enviar formulário");
    }
    setEnviando(false);
  }

  function getMaskOpts(campo: string) {
    if (campo.includes('cpf') && !campo.includes('cnpj')) return 'cpf';
    if (campo.includes('cnpj')) return 'cnpj';
    if (campo.includes('telefone') || campo.includes('whatsapp')) return 'phone';
    return null;
  }

  function handleMaskedInput(campo: string, value: string, maskType: string | null) {
    if (!maskType) { updateField(campo, value); return; }
    if (maskType === 'cpf') updateField(campo, maskCpf(value));
    else if (maskType === 'cnpj') updateField(campo, maskCnpj(value));
    else if (maskType === 'phone') updateField(campo, maskPhone(value));
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf8f3' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full agro-gradient animate-pulse mx-auto" />
        <p className="mt-4 text-gray-500">Carregando formulário...</p>
      </div>
    </div>
  );

  if (erro) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#faf8f3' }}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Link inválido</h2>
        <p className="text-gray-500 text-sm">{erro}</p>
      </div>
    </div>
  );

  if (enviado) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#faf8f3' }}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Formulário Enviado!</h2>
        <p className="text-gray-500 mb-4">Seu diagnóstico tributário foi recebido com sucesso.</p>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-500">Número do protocolo</p>
          <p className="text-lg font-bold" style={{ color: '#1a5c2a' }}>{protocolo}</p>
        </div>
        <p className="text-xs text-gray-400">
          Data: {new Date().toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );

  const etapa = ETAPAS[etapaAtual - 1];
  const progresso = Math.round(((etapaAtual - 1) / 7) * 100);

  return (
    <div className="min-h-screen" style={{ background: '#faf8f3' }}>
      <header className="agro-gradient text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Diagnóstico Tributário do Agronegócio</h1>
            {produtor && <p className="text-white/70 text-sm">{produtor.nome_razao}</p>}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/70">Salvando...</span>
            {salvando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-sm font-medium" style={{ color: '#1a5c2a' }}>Etapa {etapaAtual} de 7</span>
              <span className="text-sm text-gray-400 ml-2">— {progresso}% concluído</span>
            </div>
            <span className="text-sm text-gray-500">{etapa.icone} {etapa.nome}</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="agro-progress-bar" style={{ width: `${progresso}%` }} />
          </div>
          <div className="flex justify-between mt-3">
            {ETAPAS.map((e, i) => (
              <button key={e.id} onClick={() => i < etapaAtual - 1 && setEtapaAtual(e.id)}
                className={`step-indicator ${i + 1 < etapaAtual ? 'step-completed' : i + 1 === etapaAtual ? 'step-active' : 'step-pending'}`}
                disabled={i >= etapaAtual}>
                {i + 1 < etapaAtual ? '✓' : e.id}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          {etapaAtual === 1 && <Etapa1 respostas={respostas} updateField={updateField} handleMaskedInput={handleMaskedInput} getMaskOpts={getMaskOpts} />}
          {etapaAtual === 2 && <Etapa2 respostas={respostas} updateField={updateField} />}
          {etapaAtual === 3 && <Etapa3 respostas={respostas} updateField={updateField} />}
          {etapaAtual === 4 && <Etapa4 respostas={respostas} updateField={updateField} />}
          {etapaAtual === 5 && <Etapa5 respostas={respostas} updateField={updateField} />}
          {etapaAtual === 6 && <Etapa6 respostas={respostas} updateField={updateField} />}
          {etapaAtual === 7 && <Etapa7 respostas={respostas} etapeAtual={etapaAtual} updateField={updateField} />}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {etapaAtual > 1 && (
              <button onClick={() => setEtapaAtual(prev => prev - 1)}
                className="agro-button bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6">
                Voltar
              </button>
            )}
            <button onClick={() => { autoSave(); toast.success("Salvo! Você pode continuar depois."); }}
              className="agro-button border border-gray-300 text-gray-600 hover:bg-gray-50 px-6"
              style={{ background: '#faf8f3' }}>
              Continuar depois
            </button>
          </div>
          {etapaAtual < 7 ? (
            <button onClick={salvarEContinuar} disabled={salvando}
              className="agro-button-primary px-8 py-3 disabled:opacity-50">
              {salvando ? "Salvando..." : "Salvar e continuar"}
            </button>
          ) : (
            <button onClick={handleEnviar} disabled={enviando || !respostas.consentimento}
              className="agro-button-gold px-8 py-3 disabled:opacity-50">
              {enviando ? "Enviando..." : "Enviar formulário"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({ label, campo, respostas, updateField, type = "text", options, maskType, handleMaskedInput, placeholder, required, rows }: {
  label: string; campo: string; respostas: Record<string, any>; updateField: (c: string, v: any) => void;
  type?: string; options?: string[]; maskType?: string | null; handleMaskedInput?: Function; placeholder?: string; required?: boolean; rows?: number;
}) {
  const valor = respostas[campo] || "";
  function onChange(e: any) {
    const v = e.target.value;
    if (handleMaskedInput && maskType) {
      handleMaskedInput(campo, v, maskType);
    } else {
      updateField(campo, type === 'number' ? parseFloat(v) || 0 : v);
    }
  }
  return (
    <div className="mb-4">
      <label className="agro-label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {options ? (
        <select className="agro-input" value={valor} onChange={onChange}>
          <option value="">Selecione...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : rows ? (
        <textarea className="agro-input" rows={rows} value={valor} onChange={onChange} placeholder={placeholder} />
      ) : (
        <input type={type} className="agro-input" value={valor} onChange={onChange} placeholder={placeholder} />
      )}
    </div>
  );
}

function Etapa1({ respostas, updateField, handleMaskedInput, getMaskOpts }: any) {
  const [mostrarIE, setMostrarIE] = useState(respostas.etapa1_possui_ie === 'sim');
  const [mostrarCAEPF, setMostrarCAEPF] = useState(respostas.etapa1_possui_caepf === 'sim');
  const [mostrarOutraAtv, setMostrarOutraAtv] = useState(respostas.etapa1_atividade === 'Outra');

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center">
          <svg className="w-8 h-8" style={{ color: '#1a5c2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Identificação e Perfil</h2>
          <p className="text-sm text-gray-500">Dados básicos do produtor rural</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Nome ou Razão Social" campo="etapa1_nome" respostas={respostas} updateField={updateField} required />
        <Campo label="CPF ou CNPJ" campo="etapa1_cpf_cnpj" respostas={respostas} updateField={updateField} maskType={getMaskOpts('cpf_cnpj')} handleMaskedInput={handleMaskedInput} placeholder={respostas.etapa1_tipo === 'Pessoa Física' ? '000.000.000-00' : '00.000.000/0000-00'} />
        <Campo label="Tipo" campo="etapa1_tipo" respostas={respostas} updateField={(c: string, v: string) => { updateField(c, v); setMostrarIE(false); setMostrarCAEPF(false); }} options={TIPOS_PRODUTOR} />
        <Campo label="Atividade Principal" campo="etapa1_atividade" respostas={respostas} updateField={(c: string, v: string) => { updateField(c, v); setMostrarOutraAtv(v === 'Outra'); }} options={ATIVIDADES} />
        {mostrarOutraAtv && <Campo label="Descreva outra atividade" campo="etapa1_atividade_outra" respostas={respostas} updateField={updateField} />}
        <Campo label="Município" campo="etapa1_municipio" respostas={respostas} updateField={updateField} required />
        <Campo label="Estado" campo="etapa1_estado" respostas={respostas} updateField={updateField} options={ESTADOS} required />
        <Campo label="Telefone" campo="etapa1_telefone" respostas={respostas} updateField={updateField} maskType="phone" handleMaskedInput={handleMaskedInput} />
        <Campo label="WhatsApp" campo="etapa1_whatsapp" respostas={respostas} updateField={updateField} maskType="phone" handleMaskedInput={handleMaskedInput} />
        <Campo label="E-mail" campo="etapa1_email" respostas={respostas} updateField={updateField} type="email" />
      </div>

      <div className="mt-6 p-4 bg-green-50 rounded-xl">
        <h3 className="font-semibold text-gray-800 mb-3">Informações Adicionais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Campo label="Possui Inscrição Estadual?" campo="etapa1_possui_ie" respostas={respostas} updateField={(c: string, v: string) => { updateField(c, v); setMostrarIE(v === 'sim'); }} options={['sim', 'não']} />
          {mostrarIE && <Campo label="Número da IE" campo="etapa1_ie_numero" respostas={respostas} updateField={updateField} />}
          <Campo label="Possui CAEPF?" campo="etapa1_possui_caepf" respostas={respostas} updateField={(c: string, v: string) => { updateField(c, v); setMostrarCAEPF(v === 'sim'); }} options={['sim', 'não']} />
          {mostrarCAEPF && <Campo label="Número do CAEPF" campo="etapa1_caepf_numero" respostas={respostas} updateField={updateField} />}
          <Campo label="Possui estabelecimentos em mais de um estado?" campo="etapa1_mult_estados" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
          <Campo label="Estados onde opera" campo="etapa1_estados_operacao" respostas={respostas} updateField={updateField} placeholder="MT, GO, MS" />
        </div>
      </div>
    </div>
  );
}

function Etapa2({ respostas, updateField }: any) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center">
          <svg className="w-8 h-8" style={{ color: '#1a5c2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Dados Financeiros e Enquadramento</h2>
          <p className="text-sm text-gray-500">Informações financeiras para análise tributária</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Receita Bruta Rural - 2024" campo="etapa2_receita_2024" respostas={respostas} updateField={updateField} type="number" placeholder="Valor em R$" />
        <Campo label="Receita Bruta Rural - 2025" campo="etapa2_receita_2025" respostas={respostas} updateField={updateField} type="number" placeholder="Valor em R$" />
        <Campo label="Receita Bruta Rural - 2026" campo="etapa2_receita_2026" respostas={respostas} updateField={updateField} type="number" placeholder="Valor em R$" />
        <Campo label="Parcela Exportada (%)" campo="etapa2_exportacao" respostas={respostas} updateField={updateField} type="number" placeholder="Percentual exportado" />
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
        <p className="text-sm text-yellow-800 font-medium">⚠️ Receita superior a R$ 3.600.000,00 pode exigir análise de enquadramento como contribuinte obrigatório.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Campo label="Receita superior a R$ 3.600.000 em 2024?" campo="etapa2_acima_3600_2024" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Receita superior a R$ 3.600.000 em 2026?" campo="etapa2_acima_3600_2026" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Possui receitas de atividades não rurais?" campo="etapa2_receitas_nao_rurais" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        {respostas.etapa2_receitas_nao_rurais === 'sim' && (
          <>
            <Campo label="Quais atividades?" campo="etapa2_atividades_nao_rurais" respostas={respostas} updateField={updateField} rows={2} />
            <Campo label="Valor aproximado" campo="etapa2_valor_nao_rurais" respostas={respostas} updateField={updateField} type="number" placeholder="Valor em R$" />
          </>
        )}
        <Campo label="Regime Tributário Atual" campo="etapa2_regime" respostas={respostas} updateField={updateField} options={REGIMES} />
        <Campo label="Possui contabilidade regular?" campo="etapa2_contabilidade" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Nome do Contador/Escritório" campo="etapa2_contador" respostas={respostas} updateField={updateField} />
      </div>
    </div>
  );
}

function Etapa3({ respostas, updateField }: any) {
  const [mostraIntegrador, setMostraIntegrador] = useState(respostas.etapa3_integrado === 'sim');
  const [mostraCooperativa, setMostraCooperativa] = useState(respostas.etapa3_cooperativa === 'sim');
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center">
          <svg className="w-8 h-8" style={{ color: '#1a5c2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Operações e Cadeia Produtiva</h2>
          <p className="text-sm text-gray-500">Canais de venda e estrutura operacional</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Para quem vende?" campo="etapa3_vende_para" respostas={respostas} updateField={updateField} options={['Cooperativa', 'Trading', 'Cerealista', 'Agroindústria', 'Consumidor final', 'Diretamente', 'Outros']} />
        <Campo label="Exporta diretamente?" campo="etapa3_exporta" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Vende para trading/exportadora?" campo="etapa3_vende_trading" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="É produtor integrado?" campo="etapa3_integrado" respostas={respostas} updateField={(c: string, v: string) => { updateField(c, v); setMostraIntegrador(v === 'sim'); }} options={['sim', 'não']} />
        {mostraIntegrador && <Campo label="Nome do Integrador" campo="etapa3_integrador_nome" respostas={respostas} updateField={updateField} />}
        <Campo label="Participa de cooperativa?" campo="etapa3_cooperativa" respostas={respostas} updateField={(c: string, v: string) => { updateField(c, v); setMostraCooperativa(v === 'sim'); }} options={['sim', 'não']} />
        {mostraCooperativa && <Campo label="Nome da Cooperativa" campo="etapa3_cooperativa_nome" respostas={respostas} updateField={updateField} />}
        <Campo label="Opera com não contribuintes?" campo="etapa3_nao_contribuintes" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Principais insumos" campo="etapa3_insumos" respostas={respostas} updateField={updateField} rows={2} />
        <Campo label="Adquire máquinas agrícolas?" campo="etapa3_maquinas" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Frequência das aquisições" campo="etapa3_freq_aquisicoes" respostas={respostas} updateField={updateField} options={['Mensal', 'Trimestral', 'Semestral', 'Anual', 'Esporádica']} />
        <Campo label="Realiza vendas interestaduais?" campo="etapa3_vendas_interestaduais" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Possui contratos futuros?" campo="etapa3_contratos_futuros" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
      </div>
    </div>
  );
}

function Etapa4({ respostas, updateField }: any) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center">
          <svg className="w-8 h-8" style={{ color: '#1a5c2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Situação Fiscal Atual</h2>
          <p className="text-sm text-gray-500">Obrigações fiscais e tributárias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Já emite NF-e nas vendas?" campo="etapa4_emite_nfe" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Software de gestão fiscal" campo="etapa4_software_fiscal" respostas={respostas} updateField={updateField} />
        <Campo label="Tipo de escrituração" campo="etapa4_escrituracao" respostas={respostas} updateField={updateField} options={['LCDPR', 'Livro Caixa', 'Contabilidade gerencial', 'Contabilidade formal', 'Não possui escrituração']} />
        <Campo label="Recolhe FUNRURAL?" campo="etapa4_funrural" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Modalidade de recolhimento FUNRURAL" campo="etapa4_funrural_modalidade" respostas={respostas} updateField={updateField} options={['Sobre a receita bruta', 'Sobre a folha', 'Substituto', 'Não se aplica']} />
        <Campo label="Opera em estado com FETHAB/FUNDEINFRA/FUNDERSUL?" campo="etapa4_fundo_estadual" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Possui outras atividades comerciais?" campo="etapa4_outras_atividades" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Possui débitos tributários?" campo="etapa4_debitos" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Possui parcelamentos?" campo="etapa4_parcelamentos" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Possui pendências na Receita Federal?" campo="etapa4_pendencias_rf" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Possui pendências na SEFAZ?" campo="etapa4_pendencias_sefaz" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Possui certidões negativas válidas?" campo="etapa4_certidoes" respostas={respostas} updateField={updateField} options={['sim', 'não', 'parcial']} />
      </div>
    </div>
  );
}

function Etapa5({ respostas, updateField }: any) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center">
          <svg className="w-8 h-8" style={{ color: '#1a5c2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Patrimônio e Estrutura</h2>
          <p className="text-sm text-gray-500">Bens, propriedades e estrutura societária</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Possui imóvel rural próprio?" campo="etapa5_imovel_proprio" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Quantidade de imóveis" campo="etapa5_qtd_imoveis" respostas={respostas} updateField={updateField} type="number" />
        <Campo label="Total de hectares próprios" campo="etapa5_hectares_proprios" respostas={respostas} updateField={updateField} type="number" />
        <Campo label="Opera em área arrendada?" campo="etapa5_arrendada" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Hectares arrendados" campo="etapa5_hectares_arrendados" respostas={respostas} updateField={updateField} type="number" />
        <Campo label="Possui holding rural?" campo="etapa5_holding" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Possui seguro rural?" campo="etapa5_seguro" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Possui financiamentos?" campo="etapa5_financiamentos" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
        <Campo label="Possui planejamento sucessório?" campo="etapa5_sucessorio" respostas={respostas} updateField={updateField} options={['sim', 'não']} />
      </div>
    </div>
  );
}

function Etapa6({ respostas, updateField }: any) {
  const [arquivos, setArquivos] = useState<Record<string, File[]>>({});
  const Categorias = CATEGORIAS_DOC;

  function handleFileChange(categoria: string, files: FileList | null) {
    if (!files) return;
    setArquivos(prev => ({
      ...prev,
      [categoria]: [...(prev[categoria] || []), ...Array.from(files)],
    }));
  }

  function removerArquivo(categoria: string, index: number) {
    setArquivos(prev => ({
      ...prev,
      [categoria]: prev[categoria].filter((_, i) => i !== index),
    }));
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center">
          <svg className="w-8 h-8" style={{ color: '#1a5c2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Documentos</h2>
          <p className="text-sm text-gray-500">Anexe os documentos necessários para análise</p>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">Formatos aceitos: PDF, JPG, PNG, DOCX, XLSX</p>

      <div className="space-y-4">
        {Categorias.map(cat => (
          <div key={cat} className="border border-gray-200 rounded-xl p-4 hover:border-green-200 transition-colors">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-700 text-sm">{cat}</span>
              <span className="text-xs text-gray-400">Opcional</span>
            </label>
            <div className="mt-2">
              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-green-300 hover:bg-green-50/50 transition-all">
                <div className="text-center">
                  <svg className="w-6 h-6 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-500 mt-1">Clique para selecionar ou arraste arquivos</p>
                </div>
                <input type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx" onChange={e => handleFileChange(cat, e.target.files)} />
              </label>
            </div>
            {arquivos[cat] && arquivos[cat].length > 0 && (
              <div className="mt-2 space-y-2">
                {arquivos[cat].map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700">{file.name}</span>
                      <span className="text-gray-400 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button onClick={() => removerArquivo(cat, idx)} className="text-red-400 hover:text-red-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Etapa7({ respostas, etapeAtual, updateField }: any) {
  const secoes = [
    { titulo: "Identificação e Perfil", campos: [
      { label: "Nome/Razão Social", campo: "etapa1_nome" },
      { label: "CPF/CNPJ", campo: "etapa1_cpf_cnpj" },
      { label: "Tipo", campo: "etapa1_tipo" },
      { label: "Atividade", campo: "etapa1_atividade" },
      { label: "Município", campo: "etapa1_municipio" },
      { label: "Estado", campo: "etapa1_estado" },
      { label: "E-mail", campo: "etapa1_email" },
    ]},
    { titulo: "Dados Financeiros", campos: [
      { label: "Receita 2024", campo: "etapa2_receita_2024" },
      { label: "Receita 2026", campo: "etapa2_receita_2026" },
      { label: "Regime Tributário", campo: "etapa2_regime" },
    ]},
    { titulo: "Operações", campos: [
      { label: "Vende para", campo: "etapa3_vende_para" },
      { label: "Produtor Integrado", campo: "etapa3_integrado" },
      { label: "Participa de cooperativa", campo: "etapa3_cooperativa" },
    ]},
    { titulo: "Situação Fiscal", campos: [
      { label: "Emite NF-e", campo: "etapa4_emite_nfe" },
      { label: "Escrituração", campo: "etapa4_escrituracao" },
      { label: "FUNRURAL", campo: "etapa4_funrural" },
    ]},
    { titulo: "Patrimônio", campos: [
      { label: "Imóvel rural próprio", campo: "etapa5_imovel_proprio" },
      { label: "Holding rural", campo: "etapa5_holding" },
      { label: "Seguro rural", campo: "etapa5_seguro" },
    ]},
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center">
          <svg className="w-8 h-8" style={{ color: '#1a5c2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Revisão e Envio</h2>
          <p className="text-sm text-gray-500">Revise todas as informações antes de enviar</p>
        </div>
      </div>

      {secoes.map(sec => (
        <div key={sec.titulo} className="mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">{sec.titulo}</h3>
            <button onClick={() => etapeAtual(1)} className="text-xs font-medium" style={{ color: '#1a5c2a' }}>Editar</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sec.campos.map(c => respostas[c.campo] ? (
              <div key={c.campo}>
                <span className="text-xs text-gray-400">{c.label}:</span>
                <p className="text-sm text-gray-800 font-medium">{String(respostas[c.campo])}</p>
              </div>
            ) : null)}
          </div>
        </div>
      ))}

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="font-semibold text-gray-800 mb-4">Confirmação</h3>
        <label className="flex items-start gap-3 mb-3">
          <input type="checkbox" checked={respostas.informacoes_verdadeiras || false} onChange={e => updateField('informacoes_verdadeiras', e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300" style={{ accentColor: '#1a5c2a' }} />
          <span className="text-sm text-gray-600">Declaro que as informações prestadas são verdadeiras e assumo a responsabilidade pelas mesmas.</span>
        </label>
        <label className="flex items-start gap-3 mb-3">
          <input type="checkbox" checked={respostas.consentimento || false} onChange={e => updateField('consentimento', e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300" style={{ accentColor: '#1a5c2a' }} />
          <span className="text-sm text-gray-600">Autorizo o tratamento dos meus dados pessoais para fins de diagnóstico tributário.</span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={respostas.aceite_privacidade || false} onChange={e => updateField('aceite_privacidade', e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300" style={{ accentColor: '#1a5c2a' }} />
          <span className="text-sm text-gray-600">Aceito a política de privacidade e termos de uso.</span>
        </label>
      </div>
    </div>
  );
}
