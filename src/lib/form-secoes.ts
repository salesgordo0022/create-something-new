export type CampoDef = {
  campo: string;
  label: string;
  format?: "currency" | "number";
};

export type SecaoDef = { id: string; titulo: string; icone: string; campos: CampoDef[] };

export const SECOES: SecaoDef[] = [
  {
    id: "identificacao", titulo: "Identificação e Perfil", icone: "👤",
    campos: [
      { campo: "etapa1_nome", label: "Nome / Razão Social" },
      { campo: "etapa1_cpf_cnpj", label: "CPF ou CNPJ" },
      { campo: "etapa1_tipo", label: "Tipo" },
      { campo: "etapa1_atividade", label: "Atividade principal" },
      { campo: "etapa1_atividade_outra", label: "Outra atividade (descrição)" },
      { campo: "etapa1_estados_operacao", label: "Estados onde opera" },
      { campo: "etapa1_estados_opera_detalhe", label: "Detalhe dos estados" },
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
  {
    id: "conclusao", titulo: "Consentimento e Declarações", icone: "✍️",
    campos: [
      { campo: "etapa7_consentimento", label: "Consentimento LGPD" },
      { campo: "etapa7_informacoes_verdadeiras", label: "Declara que as informações são verdadeiras" },
      { campo: "etapa7_aceite_privacidade", label: "Aceite da política de privacidade" },
    ],
  },
];

export const CATEGORIAS_DOCUMENTOS = [
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

export function formatValor(valor: any, format?: string): string | null {
  if (valor === "" || valor === undefined || valor === null) return null;
  if (format === "currency") {
    const num = typeof valor === "string" ? parseFloat(valor.replace(/\D/g, "")) : Number(valor);
    if (isNaN(num)) return valor;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
  }
  return String(valor);
}

const VALORES_SIM_NAO = ["SIM", "NÃO", "sim", "não", "SIM → CONTRIBUINTE", "NÃO → NÃO CONTRIBUINTE"];

export function isSimNao(valor: any): boolean {
  return VALORES_SIM_NAO.includes(String(valor));
}

export function getBadgeColor(valor: string): string {
  if (["SIM", "sim", "SIM → CONTRIBUINTE", true].includes(valor as any)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["NÃO", "não", "NÃO → NÃO CONTRIBUINTE", false].includes(valor as any)) return "bg-gray-50 text-gray-500 border-gray-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

export function formatData(valor?: string | null): string {
  if (!valor) return "—";
  const d = new Date(valor);
  if (isNaN(d.getTime())) return valor;
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function exportCSV(linhas: Record<string, any>[], nomeArquivo: string) {
  const headers = [...new Set(linhas.flatMap((l) => Object.keys(l)))];
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv =
    "\uFEFF" +
    [headers.join(";"), ...linhas.map((l) => headers.map((h) => esc(l[h])).join(";"))].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

export function totalCampos(): number {
  return SECOES.flatMap((s) => s.campos).length;
}
