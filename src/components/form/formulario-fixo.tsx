import { Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { getFormularioById, salvarResposta, enviarFormulario } from "../../lib/form-service";
import { maskCpf, maskCnpj, maskPhone } from "../../lib/masks";
import type { Resposta, Produtor, Formulario } from "../../lib/types";

const ETAPAS = [
  { id: 1, nome: "Identificação e Perfil", icone: "👤" },
  { id: 2, nome: "Dados Financeiros e Enquadramento", icone: "📊" },
  { id: 3, nome: "Operações e Cadeia Produtiva", icone: "🚜" },
  { id: 4, nome: "Situação Fiscal Atual", icone: "📋" },
  { id: 5, nome: "Patrimônio e Estrutura", icone: "🏠" },
  { id: 6, nome: "Documentos", icone: "📎" },
  { id: 7, nome: "Revisão e Envio", icone: "✅" },
];

const ATIVIDADES = [
  "Soja",
  "Milho",
  "Pecuária",
  "Leite",
  "Fruticultura",
  "Avicultura",
  "Suinocultura",
  "Outra",
];
const TIPOS_PRODUTOR = [
  "Pessoa Física",
  "Pessoa Jurídica",
  "Produtor Integrado",
  "Cooperativa",
  "Agroindústria",
];
const ESTADOS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];
const CATEGORIAS_DOC = [
  "Cartão do CNPJ",
  "CPF e documento de identificação",
  "Inscrição estadual",
  "Comprovante do CAEPF",
  "Declaração do Imposto de Renda",
  "LCDPR",
  "Livro Caixa",
  "Notas fiscais",
  "Contratos de arrendamento",
  "Contratos de compra e venda",
  "Documentos dos imóveis rurais",
  "ITR",
  "CCIR",
  "CAR",
  "Certidões",
  "Comprovantes de financiamentos",
  "Outros documentos",
];

export function FormularioFixo({ formularioId }: { formularioId: string }) {
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

  const formularioRef = useRef<Formulario | null>(null);
  const respostasRef = useRef<Record<string, any>>({});
  const enviadoRef = useRef(false);

  useEffect(() => {
    formularioRef.current = formulario;
  }, [formulario]);
  useEffect(() => {
    respostasRef.current = respostas;
  }, [respostas]);
  useEffect(() => {
    enviadoRef.current = enviado;
  }, [enviado]);

  useEffect(() => {
    loadForm();
    const handle = setInterval(() => {
      if (
        formularioRef.current &&
        Object.keys(respostasRef.current).length > 0 &&
        !enviadoRef.current
      ) {
        autoSave();
      }
    }, 30000);
    return () => clearInterval(handle);
  }, []);

  async function loadForm() {
    const data = await getFormularioById(formularioId);
    if (!data) {
      setErro("Formulário não encontrado. Entre em contato com o suporte.");
      setLoading(false);
      return;
    }
    setProdutor(data.produtor);
    setFormulario(data.formulario);
    const respMap: Record<string, any> = {};
    for (const r of data.respostas as Resposta[]) {
      respMap[r.campo] = r.valor;
    }
    setRespostas(respMap);
    if (data.formulario.status_preenchimento === "formulario_enviado") {
      setEnviado(true);
      setProtocolo(data.formulario.protocolo || "");
    }
    setLoading(false);
  }

  const autoSave = useCallback(async () => {
    const f = formularioRef.current;
    if (!f || enviadoRef.current) return;
    setSalvando(true);
    for (const [campo, valor] of Object.entries(respostasRef.current)) {
      const etapa = ETAPAS.find((e) => {
        if (campo.startsWith("etapa1_")) return e.id === 1;
        if (campo.startsWith("etapa2_")) return e.id === 2;
        if (campo.startsWith("etapa3_")) return e.id === 3;
        if (campo.startsWith("etapa4_")) return e.id === 4;
        if (campo.startsWith("etapa5_")) return e.id === 5;
        return false;
      });
      await salvarResposta(f.id, etapa?.id || 1, campo, valor);
    }
    setSalvando(false);
  }, []);

  function updateField(campo: string, valor: any) {
    setRespostas((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvarEContinuar() {
    const f = formularioRef.current;
    if (!f) return;
    setSalvando(true);
    const camposEtapa = Object.entries(respostasRef.current).filter(([k]) => {
      const e = parseInt(k.split("_")[0].replace("etapa", ""));
      return e === etapaAtual;
    });
    for (const [campo, valor] of camposEtapa) {
      await salvarResposta(f.id, etapaAtual, campo, valor);
    }
    setSalvando(false);
    toast.success("Salvo com sucesso!");
    if (etapaAtual < 7) setEtapaAtual((prev) => prev + 1);
  }

  async function handleEnviar() {
    const f = formularioRef.current;
    if (!f) return;
    setEnviando(true);
    try {
      const prot = await enviarFormulario(f.id);
      setProtocolo(prot);
      setEnviado(true);
      toast.success("Formulário enviado com sucesso!");
    } catch (err) {
      toast.error("Erro ao enviar formulário");
    }
    setEnviando(false);
  }

  function getMaskOpts(campo: string) {
    if (campo.includes("cpf") && !campo.includes("cnpj")) return "cpf";
    if (campo.includes("cnpj")) return "cnpj";
    if (campo.includes("telefone") || campo.includes("whatsapp")) return "phone";
    return null;
  }

  function handleMaskedInput(campo: string, value: string, maskType: string | null) {
    if (!maskType) {
      updateField(campo, value);
      return;
    }
    if (maskType === "cpf") updateField(campo, maskCpf(value));
    else if (maskType === "cnpj") updateField(campo, maskCnpj(value));
    else if (maskType === "phone") updateField(campo, maskPhone(value));
  }

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#f2efe8" }}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl agro-gradient animate-pulse mx-auto shadow-xl shadow-[#0d4f1a]/10" />
          <p className="mt-6 text-gray-500 font-medium text-lg">Carregando formulário...</p>
        </div>
      </div>
    );

  if (erro)
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "#f2efe8" }}
      >
        <div className="bg-white rounded-3xl agro-shadow-xl border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Formulário não encontrado</h2>
          <p className="text-gray-500 text-base mb-6">{erro}</p>
          <Link
            to="/gestao"
            className="inline-flex items-center gap-2 agro-button-primary px-6 py-2.5 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Voltar à gestão
          </Link>
        </div>
      </div>
    );

  if (enviado)
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "#f2efe8" }}
      >
        <div className="bg-white rounded-3xl agro-shadow-xl border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0] flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg
              className="w-12 h-12 text-[#0d4f1a]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Formulário Enviado!</h2>
          <p className="text-gray-500 text-base mb-6">
            O diagnóstico tributário foi salvo com sucesso.
          </p>
          <div className="bg-gradient-to-br from-[#f2efe8] to-[#e8f5e9] rounded-2xl p-6 mb-6 border border-[#0d4f1a]/10">
            <p className="text-sm text-gray-500 mb-1.5">Número do protocolo</p>
            <p className="text-xl font-bold" style={{ color: "#0d4f1a" }}>
              {protocolo}
            </p>
          </div>
          <Link
            to="/gestao"
            className="inline-flex items-center justify-center gap-2 agro-button-primary w-full px-6 py-2.5 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Voltar à gestão
          </Link>
        </div>
      </div>
    );

  const etapa = ETAPAS[etapaAtual - 1];
  const progresso = Math.round(((etapaAtual - 1) / 7) * 100);

  return (
    <div className="min-h-screen" style={{ background: "#f2efe8" }}>
      <header className="text-white relative overflow-hidden min-h-[160px]">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80"
          alt="Fazenda"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d4f1a]/85 via-[#0d4f1a]/60 to-[#0d4f1a]/40" />
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6 lg:py-7 relative z-10">
          <Link
            to="/gestao"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 mb-4 ring-1 ring-white/15 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Voltar à gestão
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/12 backdrop-blur-md flex items-center justify-center border border-white/15">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold tracking-tight">
                  Diagnóstico Tributário do Agronegócio
                </h1>
                {produtor && <p className="text-white/60 text-sm mt-0.5">{produtor.nome_razao}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span>{salvando ? "Salvando..." : "Salvo"}</span>
              {salvando && (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {!salvando && (
                <svg
                  className="w-3.5 h-3.5 text-green-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8 lg:py-10">
        <div className="bg-white rounded-2xl agro-shadow-lg border border-gray-100 p-6 lg:p-8 mb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: "#0d4f1a" }}
              >
                Etapa {etapaAtual} de 7
              </span>
              <span className="text-xs text-gray-400 ml-3">— {progresso}% concluído</span>
            </div>
            <span className="text-sm text-gray-600 font-medium">
              {etapa.icone} {etapa.nome}
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="agro-progress-bar" style={{ width: `${progresso}%` }} />
          </div>
          <div className="flex justify-between mt-6 px-1">
            {ETAPAS.map((e, i) => (
              <button
                key={e.id}
                onClick={() => i < etapaAtual - 1 && setEtapaAtual(e.id)}
                className={`step-indicator ${i + 1 < etapaAtual ? "step-completed" : i + 1 === etapaAtual ? "step-active" : "step-pending"}`}
                disabled={i >= etapaAtual}
              >
                {i + 1 < etapaAtual ? "✓" : e.id}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl agro-shadow-xl border border-gray-100 p-8 lg:p-10 mb-8">
          {etapaAtual === 1 && (
            <Etapa1
              respostas={respostas}
              updateField={updateField}
              handleMaskedInput={handleMaskedInput}
              getMaskOpts={getMaskOpts}
            />
          )}
          {etapaAtual === 2 && <Etapa2 respostas={respostas} updateField={updateField} />}
          {etapaAtual === 3 && <Etapa3 respostas={respostas} updateField={updateField} />}
          {etapaAtual === 4 && <Etapa4 respostas={respostas} updateField={updateField} />}
          {etapaAtual === 5 && <Etapa5 respostas={respostas} updateField={updateField} />}
          {etapaAtual === 6 && <Etapa6 respostas={respostas} updateField={updateField} />}
          {etapaAtual === 7 && <Etapa7 respostas={respostas} updateField={updateField} />}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-3">
            {etapaAtual > 1 && (
              <button
                onClick={() => setEtapaAtual((prev) => prev - 1)}
                className="agro-button bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-3"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Voltar
              </button>
            )}
            <button
              onClick={() => {
                autoSave();
                toast.success("Salvo com sucesso!");
              }}
              className="agro-button border border-gray-200 text-gray-600 hover:bg-gray-50 px-6 py-3"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Salvar rascunho
            </button>
          </div>
          {etapaAtual < 7 ? (
            <button
              onClick={salvarEContinuar}
              disabled={salvando}
              className="agro-button-primary px-10 py-3 disabled:opacity-50 text-base"
            >
              {salvando ? "Salvando..." : "Salvar e continuar"}
              {!salvando && (
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </button>
          ) : (
            <button
              onClick={handleEnviar}
              disabled={enviando || !respostas.etapa7_consentimento}
              className="agro-button-gold px-10 py-3 disabled:opacity-50 text-base"
            >
              {enviando ? "Enviando..." : "Enviar formulário"}
              {!enviando && (
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({
  label,
  campo,
  respostas,
  updateField,
  type = "text",
  options,
  maskType,
  handleMaskedInput,
  placeholder,
  required,
  rows,
}: {
  label: string;
  campo: string;
  respostas: Record<string, any>;
  updateField: (c: string, v: any) => void;
  type?: string;
  options?: string[];
  maskType?: string | null;
  handleMaskedInput?: Function;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  const valor = respostas[campo] || "";
  function onChange(e: any) {
    const v = e.target.value;
    if (handleMaskedInput && maskType) {
      handleMaskedInput(campo, v, maskType);
    } else {
      updateField(campo, type === "number" ? parseFloat(v) || 0 : v);
    }
  }
  return (
    <div className="mb-6">
      <label className="agro-label text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {options ? (
        <select className="agro-input py-3 px-4" value={valor} onChange={onChange}>
          <option value="">Selecione...</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : rows ? (
        <textarea
          className="agro-input py-3 px-4"
          rows={rows}
          value={valor}
          onChange={onChange}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          className="agro-input"
          value={valor}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function Etapa1({ respostas, updateField, handleMaskedInput, getMaskOpts }: any) {
  const [mostrarIE, setMostrarIE] = useState(respostas.etapa1_possui_ie === "sim");
  const [mostrarCAEPF, setMostrarCAEPF] = useState(respostas.etapa1_possui_caepf === "sim");
  const [mostrarEstadosOp, setMostrarEstadosOp] = useState(respostas.etapa1_mult_estados === "sim");
  const [mostrarOutraAtv, setMostrarOutraAtv] = useState(respostas.etapa1_atividade === "Outra");

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center">
          <svg
            className="w-8 h-8"
            style={{ color: "#1a5c2a" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Identificação e Perfil</h2>
          <p className="text-sm text-gray-500">Dados básicos do produtor rural</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo
          label="Nome / Razão Social"
          campo="etapa1_nome"
          respostas={respostas}
          updateField={updateField}
          required
        />
        <Campo
          label="CPF ou CNPJ"
          campo="etapa1_cpf_cnpj"
          respostas={respostas}
          updateField={updateField}
          maskType={getMaskOpts("cpf_cnpj")}
          handleMaskedInput={handleMaskedInput}
          placeholder={
            respostas.etapa1_tipo === "Pessoa Física" ? "000.000.000-00" : "00.000.000/0000-00"
          }
          required
        />
        <Campo
          label="Tipo"
          campo="etapa1_tipo"
          respostas={respostas}
          updateField={updateField}
          options={TIPOS_PRODUTOR}
          required
        />
        <Campo
          label="Atividade principal"
          campo="etapa1_atividade"
          respostas={respostas}
          updateField={(c: string, v: string) => {
            updateField(c, v);
            setMostrarOutraAtv(v === "Outra");
          }}
          options={ATIVIDADES}
          required
        />
        {mostrarOutraAtv && (
          <Campo
            label="Descreva a atividade"
            campo="etapa1_atividade_outra"
            respostas={respostas}
            updateField={updateField}
            required
          />
        )}
        <Campo
          label="Estados onde opera"
          campo="etapa1_estados_operacao"
          respostas={respostas}
          updateField={updateField}
          placeholder="Ex: MT, GO, MS"
        />
        <Campo
          label="Possui estabelecimentos em mais de um estado?"
          campo="etapa1_mult_estados"
          respostas={respostas}
          updateField={(c: string, v: string) => {
            updateField(c, v);
            setMostrarEstadosOp(v === "sim");
          }}
          options={["SIM", "NÃO"]}
        />
        {mostrarEstadosOp && (
          <Campo
            label="Quais estados?"
            campo="etapa1_estados_opera_detalhe"
            respostas={respostas}
            updateField={updateField}
            placeholder="Ex: MT, GO, MS"
          />
        )}
        <Campo
          label="Tem Inscrição Estadual (IE)?"
          campo="etapa1_possui_ie"
          respostas={respostas}
          updateField={(c: string, v: string) => {
            updateField(c, v);
            setMostrarIE(v === "sim");
          }}
          options={["SIM", "NÃO"]}
        />
        {mostrarIE && (
          <Campo
            label="Número da IE"
            campo="etapa1_ie_numero"
            respostas={respostas}
            updateField={updateField}
            placeholder="Insira o número"
          />
        )}
        <Campo
          label="Possui CAEPF?"
          campo="etapa1_possui_caepf"
          respostas={respostas}
          updateField={(c: string, v: string) => {
            updateField(c, v);
            setMostrarCAEPF(v === "sim");
          }}
          options={["SIM", "NÃO"]}
        />
        {mostrarCAEPF && (
          <Campo
            label="Número do CAEPF"
            campo="etapa1_caepf_numero"
            respostas={respostas}
            updateField={updateField}
            placeholder="Insira o número"
          />
        )}
      </div>
    </div>
  );
}

function Etapa2({ respostas, updateField }: any) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center">
          <svg
            className="w-8 h-8"
            style={{ color: "#1a5c2a" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Dados Financeiros e Enquadramento</h2>
          <p className="text-sm text-gray-500">Informações financeiras para análise tributária</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Receitas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo
              label="Receita bruta rural total em 2024 (R$)"
              campo="etapa2_receita_2024"
              respostas={respostas}
              updateField={updateField}
              type="number"
              placeholder="Valor em R$"
            />
            <Campo
              label="Parcela exportada em 2024 (R$)"
              campo="etapa2_exportacao_2024"
              respostas={respostas}
              updateField={updateField}
              type="number"
              placeholder="Valor em R$"
            />
            <Campo
              label="Receita bruta rural total em 2026 (R$)"
              campo="etapa2_receita_2026"
              respostas={respostas}
              updateField={updateField}
              type="number"
              placeholder="Valor em R$"
            />
            <Campo
              label="Parcela exportada em 2026 (R$)"
              campo="etapa2_exportacao_2026"
              respostas={respostas}
              updateField={updateField}
              type="number"
              placeholder="Valor em R$"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Campo
            label="Possui receitas de atividades NÃO rurais?"
            campo="etapa2_receitas_nao_rurais"
            respostas={respostas}
            updateField={updateField}
            options={["SIM", "NÃO"]}
          />
          {respostas.etapa2_receitas_nao_rurais === "SIM" && (
            <Campo
              label="Quais?"
              campo="etapa2_atividades_nao_rurais"
              respostas={respostas}
              updateField={updateField}
              rows={2}
              placeholder="Descreva as atividades não rurais"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Etapa3({ respostas, updateField }: any) {
  const [mostraIntegrador, setMostraIntegrador] = useState(respostas.etapa3_integrado === "SIM");
  const [mostraCooperativa, setMostraCooperativa] = useState(
    respostas.etapa3_cooperativa === "SIM",
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center">
          <svg
            className="w-8 h-8"
            style={{ color: "#1a5c2a" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Operações e Cadeia Produtiva</h2>
          <p className="text-sm text-gray-500">Canais de venda, insumos e relacionamento</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Canais de Venda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo
              label="Vende para"
              campo="etapa3_vende_para"
              respostas={respostas}
              updateField={updateField}
              options={[
                "Cooperativa",
                "Trading",
                "Cerealista",
                "Agroindústria",
                "Consumidor final",
                "Diretamente",
                "Outros",
              ]}
            />
            <Campo
              label="Exporta diretamente?"
              campo="etapa3_exporta"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
            <Campo
              label="Vende para empresa exportadora (trading/ECE)?"
              campo="etapa3_vende_trading"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Relacionamento Contratual</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo
              label="É produtor integrado (contrato de integração com agroindústria)?"
              campo="etapa3_integrado"
              respostas={respostas}
              updateField={(c: string, v: string) => {
                updateField(c, v);
                setMostraIntegrador(v === "SIM");
              }}
              options={["SIM", "NÃO"]}
            />
            {mostraIntegrador && (
              <Campo
                label="Nome do Integrador"
                campo="etapa3_integrador_nome"
                respostas={respostas}
                updateField={updateField}
              />
            )}
            <Campo
              label="Participa de cooperativa?"
              campo="etapa3_cooperativa"
              respostas={respostas}
              updateField={(c: string, v: string) => {
                updateField(c, v);
                setMostraCooperativa(v === "SIM");
              }}
              options={["SIM", "NÃO"]}
            />
            {mostraCooperativa && (
              <Campo
                label="Nome da Cooperativa"
                campo="etapa3_cooperativa_nome"
                respostas={respostas}
                updateField={updateField}
              />
            )}
            <Campo
              label="Tem operações com não contribuintes?"
              campo="etapa3_nao_contribuintes"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Insumos e Aquisições</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo
              label="Principais insumos adquiridos (fertilizantes, defensivos, sementes etc.)"
              campo="etapa3_insumos"
              respostas={respostas}
              updateField={updateField}
              rows={2}
              placeholder="Liste os principais insumos"
            />
            <Campo
              label="De quem adquire os insumos?"
              campo="etapa3_fornecedores"
              respostas={respostas}
              updateField={updateField}
              placeholder="Ex: Cooperativa, loja agropecuária, direto da indústria"
            />
            <Campo
              label="Adquire máquinas e implementos agrícolas?"
              campo="etapa3_maquinas"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
            <Campo
              label="Frequência das aquisições"
              campo="etapa3_freq_aquisicoes"
              respostas={respostas}
              updateField={updateField}
              options={["Mensal", "Trimestral", "Semestral", "Anual", "Esporádica"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Etapa4({ respostas, updateField }: any) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center">
          <svg
            className="w-8 h-8"
            style={{ color: "#1a5c2a" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Situação Fiscal Atual</h2>
          <p className="text-sm text-gray-500">Obrigações fiscais, escrituração e tributos</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Documentação Fiscal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo
              label="Já emite NF-e nas vendas?"
              campo="etapa4_emite_nfe"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
            <Campo
              label="Sistema/Software de gestão fiscal utilizado"
              campo="etapa4_software_fiscal"
              respostas={respostas}
              updateField={updateField}
              placeholder="Ex: Mastermaq, Orbia, Contmatic..."
            />
            <Campo
              label="Tipo de escrituração"
              campo="etapa4_escrituracao"
              respostas={respostas}
              updateField={updateField}
              options={[
                "LCDPR",
                "Livro Caixa",
                "Contabilidade gerencial / formal",
                "Não possui escrituração",
              ]}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Tributos e Obrigações</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo
              label="Recolhe Funrural?"
              campo="etapa4_funrural"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
            <Campo
              label="Modalidade de recolhimento"
              campo="etapa4_funrural_modalidade"
              respostas={respostas}
              updateField={updateField}
              options={[
                "Sobre a receita bruta",
                "Sobre a folha de pagamento",
                "Substituto",
                "Não se aplica",
              ]}
            />
            <Campo
              label="Opera em estado com FETHAB/FUNDEINFRA/FUNDERSUL?"
              campo="etapa4_fundo_estadual"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
            {respostas.etapa4_fundo_estadual === "SIM" && (
              <Campo
                label="Qual estado?"
                campo="etapa4_fundo_estado"
                respostas={respostas}
                updateField={updateField}
              />
            )}
            <Campo
              label="Tem gestão financeira?"
              campo="etapa4_gestao_financeira"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
            <Campo
              label="Tem outras atividades comerciais ou de serviços?"
              campo="etapa4_outras_atividades"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Situação de Regularidade</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo
              label="Possui débitos tributários?"
              campo="etapa4_debitos"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
            <Campo
              label="Possui parcelamentos?"
              campo="etapa4_parcelamentos"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
            <Campo
              label="Possui certidões negativas válidas?"
              campo="etapa4_certidoes"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO", "Parcialmente"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Etapa5({ respostas, updateField }: any) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center">
          <svg
            className="w-8 h-8"
            style={{ color: "#1a5c2a" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Patrimônio e Estrutura</h2>
          <p className="text-sm text-gray-500">Bens, propriedades e estrutura societária</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Imóveis Rurais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo
              label="Possui imóvel rural próprio?"
              campo="etapa5_imovel_proprio"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
            <Campo
              label="Total de hectares próprios"
              campo="etapa5_hectares_proprios"
              respostas={respostas}
              updateField={updateField}
              type="number"
              placeholder="Hectares"
            />
            <Campo
              label="Opera em área arrendada?"
              campo="etapa5_arrendada"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
            <Campo
              label="Hectares arrendados"
              campo="etapa5_hectares_arrendados"
              respostas={respostas}
              updateField={updateField}
              type="number"
              placeholder="Hectares"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Estrutura Societária</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo
              label="Possui holding rural ou estrutura societária?"
              campo="etapa5_holding"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
            {respostas.etapa5_holding === "SIM" && (
              <Campo
                label="Descrição da estrutura"
                campo="etapa5_holding_descricao"
                respostas={respostas}
                updateField={updateField}
                rows={2}
              />
            )}
            <Campo
              label="Possui sócios/herdeiros que também atuam na atividade?"
              campo="etapa5_socios"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Contratos e Financiamentos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo
              label="Possui seguro rural?"
              campo="etapa5_seguro"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
            <Campo
              label="Financiamentos em andamento?"
              campo="etapa5_financiamentos"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
            <Campo
              label="Possui estruturas contratuais de vendas e compras?"
              campo="etapa5_contratos"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
            <Campo
              label="Possui planejamento sucessório?"
              campo="etapa5_sucessorio"
              respostas={respostas}
              updateField={updateField}
              options={["SIM", "NÃO"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Etapa6({ respostas, updateField }: any) {
  const [arquivos, setArquivos] = useState<Record<string, File[]>>({});

  function handleFileChange(categoria: string, files: FileList | null) {
    if (!files) return;
    setArquivos((prev) => ({
      ...prev,
      [categoria]: [...(prev[categoria] || []), ...Array.from(files)],
    }));
  }

  function removerArquivo(categoria: string, index: number) {
    setArquivos((prev) => ({
      ...prev,
      [categoria]: prev[categoria].filter((_, i) => i !== index),
    }));
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center">
          <svg
            className="w-8 h-8"
            style={{ color: "#1a5c2a" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Documentos</h2>
          <p className="text-sm text-gray-500">Anexe os documentos necessários para análise</p>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">Formatos aceitos: PDF, JPG, PNG, DOCX, XLSX</p>

      <div className="space-y-4">
        {CATEGORIAS_DOC.map((cat) => (
          <div
            key={cat}
            className="border border-gray-200 rounded-xl p-4 hover:border-green-200 transition-colors"
          >
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-700 text-sm">{cat}</span>
              <span className="text-xs text-gray-400">Opcional</span>
            </label>
            <div className="mt-2">
              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-green-300 hover:bg-green-50/50 transition-all">
                <div className="text-center">
                  <svg
                    className="w-6 h-6 mx-auto text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm text-gray-500 mt-1">
                    Clique para selecionar ou arraste arquivos
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                  onChange={(e) => handleFileChange(cat, e.target.files)}
                />
              </label>
            </div>
            {arquivos[cat] && arquivos[cat].length > 0 && (
              <div className="mt-2 space-y-2">
                {arquivos[cat].map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-gray-700">{file.name}</span>
                      <span className="text-gray-400 text-xs">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removerArquivo(cat, idx)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
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

function Etapa7({ respostas, updateField }: any) {
  const secoes = [
    {
      titulo: "Identificação e Perfil",
      campos: [
        { label: "Nome / Razão Social", campo: "etapa1_nome" },
        { label: "CPF/CNPJ", campo: "etapa1_cpf_cnpj" },
        { label: "Tipo", campo: "etapa1_tipo" },
        { label: "Atividade principal", campo: "etapa1_atividade" },
        { label: "Estados onde opera", campo: "etapa1_estados_operacao" },
        { label: "IE", campo: "etapa1_ie_numero" },
        { label: "CAEPF", campo: "etapa1_caepf_numero" },
      ],
    },
    {
      titulo: "Dados Financeiros e Enquadramento",
      campos: [
        { label: "Receita bruta 2024", campo: "etapa2_receita_2024" },
        { label: "Exportação 2024", campo: "etapa2_exportacao_2024" },
        { label: "Receita bruta 2026", campo: "etapa2_receita_2026" },
        { label: "Exportação 2026", campo: "etapa2_exportacao_2026" },
        { label: "Receitas não rurais", campo: "etapa2_receitas_nao_rurais" },
      ],
    },
    {
      titulo: "Operações e Cadeia Produtiva",
      campos: [
        { label: "Vende para", campo: "etapa3_vende_para" },
        { label: "Exporta diretamente", campo: "etapa3_exporta" },
        { label: "Produtor integrado", campo: "etapa3_integrado" },
        { label: "Cooperativa", campo: "etapa3_cooperativa" },
        { label: "Operações com não contribuintes", campo: "etapa3_nao_contribuintes" },
      ],
    },
    {
      titulo: "Situação Fiscal Atual",
      campos: [
        { label: "Emite NF-e", campo: "etapa4_emite_nfe" },
        { label: "Software fiscal", campo: "etapa4_software_fiscal" },
        { label: "Escrituração", campo: "etapa4_escrituracao" },
        { label: "Funrural", campo: "etapa4_funrural" },
        { label: "FETHAB/FUNDEINFRA/FUNDERSUL", campo: "etapa4_fundo_estadual" },
        { label: "Gestão financeira", campo: "etapa4_gestao_financeira" },
        { label: "Outras atividades", campo: "etapa4_outras_atividades" },
      ],
    },
    {
      titulo: "Patrimônio e Estrutura",
      campos: [
        { label: "Imóvel próprio", campo: "etapa5_imovel_proprio" },
        { label: "Hectares próprios", campo: "etapa5_hectares_proprios" },
        { label: "Área arrendada", campo: "etapa5_arrendada" },
        { label: "Holding rural", campo: "etapa5_holding" },
        { label: "Sócios/herdeiros na atividade", campo: "etapa5_socios" },
        { label: "Seguro rural", campo: "etapa5_seguro" },
        { label: "Financiamentos", campo: "etapa5_financiamentos" },
        { label: "Contratos de venda/compra", campo: "etapa5_contratos" },
        { label: "Planejamento sucessório", campo: "etapa5_sucessorio" },
      ],
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center">
          <svg
            className="w-8 h-8"
            style={{ color: "#1a5c2a" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Revisão e Envio</h2>
          <p className="text-sm text-gray-500">Revise todas as informações antes de enviar</p>
        </div>
      </div>

      {secoes.map((sec) => (
        <div key={sec.titulo} className="mb-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-3">{sec.titulo}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sec.campos.map((c) =>
              respostas[c.campo] ? (
                <div key={c.campo}>
                  <span className="text-xs text-gray-400">{c.label}:</span>
                  <p className="text-sm text-gray-800 font-medium">{String(respostas[c.campo])}</p>
                </div>
              ) : null,
            )}
          </div>
        </div>
      ))}

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="font-semibold text-gray-800 mb-4">Confirmação</h3>
        <label className="flex items-start gap-3 mb-3">
          <input
            type="checkbox"
            checked={respostas.etapa7_informacoes_verdadeiras || false}
            onChange={(e) => updateField("etapa7_informacoes_verdadeiras", e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300"
            style={{ accentColor: "#1a5c2a" }}
          />
          <span className="text-sm text-gray-600">
            Declaro que as informações prestadas são verdadeiras e assumo a responsabilidade pelas
            mesmas.
          </span>
        </label>
        <label className="flex items-start gap-3 mb-3">
          <input
            type="checkbox"
            checked={respostas.etapa7_consentimento || false}
            onChange={(e) => updateField("etapa7_consentimento", e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300"
            style={{ accentColor: "#1a5c2a" }}
          />
          <span className="text-sm text-gray-600">
            Autorizo o tratamento dos meus dados pessoais para fins de diagnóstico tributário.
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={respostas.etapa7_aceite_privacidade || false}
            onChange={(e) => updateField("etapa7_aceite_privacidade", e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300"
            style={{ accentColor: "#1a5c2a" }}
          />
          <span className="text-sm text-gray-600">
            Aceito a política de privacidade e termos de uso.
          </span>
        </label>
      </div>
    </div>
  );
}
