export interface Produtor {
  id: string;
  nome_razao: string;
  cpf_cnpj?: string;
  tipo?: string;
  atividade_principal?: string;
  atividade_outra?: string;
  estados_operacao?: string[];
  possui_mult_estados?: boolean;
  possui_ie?: boolean;
  ie_numero?: string;
  possui_caepf?: boolean;
  caepf_numero?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  municipio?: string;
  estado?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Formulario {
  id: string;
  produtor_id: string;
  link_id?: string;
  status_preenchimento: string;
  status_diagnostico: string;
  percentual_preenchido: number;
  protocolo?: string;
  data_envio?: string;
  responsavel_interno_id?: string;
  consentimento_lgpd?: boolean;
  informacoes_verdadeiras?: boolean;
  aceite_privacidade?: boolean;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Resposta {
  id: string;
  formulario_id: string;
  etapa: number;
  campo: string;
  valor: any;
  created_at?: string;
  updated_at?: string;
}

export interface LinkFormulario {
  id: string;
  produtor_id: string;
  codigo: string;
  data_criacao: string;
  data_validade?: string;
  status: string;
  created_at?: string;
}

export interface Documento {
  id: string;
  formulario_id: string;
  produtor_id: string;
  categoria: string;
  nome_arquivo: string;
  url: string;
  tamanho?: number;
  tipo_arquivo?: string;
  descricao?: string;
  status: string;
  observacao?: string;
  obrigatorio?: boolean;
  created_at?: string;
}

export interface Diagnostico {
  id: string;
  formulario_id: string;
  enquadramento_ibs_cbs?: string;
  justificativa_enquadramento?: string;
  nivel_risco?: string;
  parecer_conclusivo?: string;
  data_diagnostico?: string;
  responsavel_id?: string;
  data_prevista_retorno?: string;
  proxima_acao?: string;
  created_at?: string;
}

export interface AcaoPrioritaria {
  id: string;
  diagnostico_id: string;
  descricao: string;
  prazo?: string;
  concluida: boolean;
}

export interface OportunidadeServico {
  id: string;
  diagnostico_id: string;
  descricao: string;
  prioridade: string;
}

export interface Observacao {
  id: string;
  formulario_id: string;
  autor_id?: string;
  autor_nome?: string;
  texto: string;
  categoria?: string;
  importante: boolean;
  created_at?: string;
}

export interface Historico {
  id: string;
  formulario_id: string;
  produtor_id?: string;
  usuario_id?: string;
  usuario_nome?: string;
  acao: string;
  descricao?: string;
  valores_anteriores?: any;
  valores_novos?: any;
  created_at?: string;
}

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  cargo?: string;
  avatar_url?: string;
}

export const STATUS_PREENCHIMENTO = [
  'cadastro_criado',
  'link_enviado',
  'aguardando_preenchimento',
  'em_preenchimento',
  'formulario_enviado',
  'em_analise',
  'aguardando_documentos',
  'aguardando_retorno_produtor',
  'reuniao_agendada',
  'diagnostico_concluido',
  'apresentado_ao_produtor',
  'arquivado',
] as const;

export const CATEGORIAS_DOCUMENTO = [
  'Cartão do CNPJ',
  'CPF e documento de identificação',
  'Inscrição estadual',
  'Comprovante do CAEPF',
  'Declaração do Imposto de Renda',
  'LCDPR',
  'Livro Caixa',
  'Notas fiscais',
  'Contratos de arrendamento',
  'Contratos de compra e venda',
  'Documentos dos imóveis rurais',
  'ITR',
  'CCIR',
  'CAR',
  'Certidões',
  'Comprovantes de financiamentos',
  'Outros documentos',
] as const;

export const ATIVIDADES = [
  'Soja', 'Milho', 'Pecuária', 'Leite',
  'Fruticultura', 'Avicultura', 'Suinocultura', 'Outra',
] as const;

export const TIPOS_PRODUTOR = [
  'Pessoa Física', 'Pessoa Jurídica', 'Produtor Integrado',
  'Cooperativa', 'Agroindústria',
] as const;

export const REGIMES_TRIBUTARIOS = [
  'Simples Nacional', 'Lucro Presumido', 'Lucro Real',
  'MEI', 'Produtor Rural PF',
] as const;
