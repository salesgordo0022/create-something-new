import { supabase } from "./supabase";

interface ProdutorInput {
  nome_razao: string; cpf_cnpj?: string; email?: string; telefone?: string;
  municipio?: string; estado?: string; atividade_principal?: string; tipo?: string;
}

const DEV_SEED: Record<string, any> = {
  "AGRO-DEMO-0001": {
    formId: "dev-form-demo",
    codigo: "AGRO-DEMO-0001",
    nome: "Fazenda Santa Fé Agro Ltda",
    cpf_cnpj: "12.345.678/0001-90",
    tipo: "Pessoa Jurídica",
    atividade_principal: "Soja",
    municipio: "Sorriso",
    estado: "MT",
    telefone: "(66) 99999-1234",
    email: "contato@santafe.agr.br",
    status: "diagnostico_concluido",
    status_diagnostico: "concluido",
    percentual: 100,
    protocolo: "PROT-0001",
    data_envio: "2026-07-15T14:30:00.000Z",
    respostas: {
      etapa1_nome: "Fazenda Santa Fé Agro Ltda",
      etapa1_cpf_cnpj: "12.345.678/0001-90",
      etapa1_tipo: "Pessoa Jurídica",
      etapa1_atividade: "Soja",
      etapa1_atividade_outra: "Milho (safrinha)",
      etapa1_estados_operacao: "MT, PA",
      etapa1_estados_opera_detalhe: "Matriz em Sorriso/MT e área arrendada em Novo Progresso/PA",
      etapa1_mult_estados: true,
      etapa1_possui_ie: true,
      etapa1_ie_numero: "001.234.567-8",
      etapa1_possui_caepf: false,
      etapa1_caepf_numero: "",
      etapa2_receita_2024: 4200000,
      etapa2_exportacao_2024: 1150000,
      etapa2_receita_2026: 5800000,
      etapa2_exportacao_2026: 2300000,
      etapa2_receitas_nao_rurais: false,
      etapa2_atividades_nao_rurais: "",
      etapa3_vende_para: "Trading/exportadora",
      etapa3_exporta: true,
      etapa3_vende_trading: true,
      etapa3_integrado: false,
      etapa3_integrador_nome: "",
      etapa3_cooperativa: false,
      etapa3_cooperativa_nome: "",
      etapa3_nao_contribuintes: false,
      etapa3_insumos: "Sementes, defensivos e fertilizantes",
      etapa3_fornecedores: "Cooperativa regional e revendas multinacionais",
      etapa3_maquinas: true,
      etapa3_freq_aquisicoes: "A cada safra",
      etapa4_emite_nfe: true,
      etapa4_software_fiscal: "ERP terceirizado",
      etapa4_escrituracao: "Escrituração completa",
      etapa4_funrural: true,
      etapa4_funrural_modalidade: "3,05% sobre a receita",
      etapa4_fundo_estadual: true,
      etapa4_fundo_estado: "MT (FETHAB)",
      etapa4_gestao_financeira: true,
      etapa4_outras_atividades: false,
      etapa4_debitos: false,
      etapa4_parcelamentos: false,
      etapa4_certidoes: true,
      etapa5_imovel_proprio: true,
      etapa5_hectares_proprios: 1250,
      etapa5_arrendada: true,
      etapa5_hectares_arrendados: 640,
      etapa5_holding: false,
      etapa5_holding_descricao: "",
      etapa5_socios: false,
      etapa5_seguro: true,
      etapa5_financiamentos: true,
      etapa5_contratos: true,
      etapa5_sucessorio: false,
      etapa7_consentimento: true,
      etapa7_informacoes_verdadeiras: true,
      etapa7_aceite_privacidade: true,
    },
    diagnostico: {
      enquadramento_ibs_cbs: "Contribuinte obrigatório",
      nivel_risco: "Médio",
      justificativa_enquadramento: "Receita bruta anual superior ao limite de R$ 3,6 milhões, enquadrando-se como contribuinte obrigatório do IBS/CBS. Operações interestaduais de venda para trading demandam atenção à retenção e distribuição dos tributos.",
      parecer_conclusivo: "Produtor enquadrado como contribuinte obrigatório do IBS/CBS. Recomenda-se estruturação de créditos fiscais sobre insumos, revisão das operações interestaduais e planejamento sucessório do patrimônio rural.",
      proxima_acao: "Apresentar parecer ao produtor e coletar notas fiscais de 2024-2026 para apuração de créditos.",
      data_diagnostico: "2026-07-22T10:00:00.000Z",
      data_prevista_retorno: "2026-08-15T00:00:00.000Z",
    },
    acoes: [
      { id: "dev-a1", descricao: "Levantar notas fiscais de compra de insumos (2024-2026)", prazo: "2026-08-15", concluida: true },
      { id: "dev-a2", descricao: "Analisar créditos de IBS/CBS sobre operações com trading", prazo: "2026-08-30", concluida: false },
      { id: "dev-a3", descricao: "Estruturar planejamento sucessório do imóvel rural", prazo: "2026-09-30", concluida: false },
    ],
    oportunidades: [
      { id: "dev-op1", descricao: "Recuperação de créditos tributários sobre insumos adquiridos", prioridade: "alta" },
      { id: "dev-op2", descricao: "Planejamento sucessório e constituição de holding", prioridade: "media" },
      { id: "dev-op3", descricao: "Gestão de ICMS-ST em aquisições interestaduais", prioridade: "baixa" },
    ],
    observacoes: [
      { id: "dev-o1", texto: "Produtor relatou que a venda da safra 2026 para trading foi antecipada; acompanhar emissão das notas.", categoria: "Comercial", importante: true, created_at: "2026-07-20T16:45:00.000Z" },
      { id: "dev-o2", texto: "Reunião de apresentação do parecer agendada para o dia 30/07.", categoria: "Reunião", importante: false, created_at: "2026-07-24T11:20:00.000Z" },
    ],
    pendencias: [
      { id: "dev-p1", descricao: "Aguardando envio do LCDPR 2025 pelo produtor", tipo: "documento", resolvida: false, created_at: "2026-07-24T09:10:00.000Z" },
      { id: "dev-p2", descricao: "Validar certidões negativas estaduais (MT e PA)", tipo: "informacao", resolvida: true, created_at: "2026-07-21T15:00:00.000Z" },
    ],
    historico: [
      { id: "dev-h1", acao: "Formulário enviado", descricao: "Produtor submeteu o formulário com 100% de preenchimento.", created_at: "2026-07-15T14:32:00.000Z" },
      { id: "dev-h2", acao: "Diagnóstico concluído", descricao: "Classificação finalizada: contribuinte obrigatório, risco médio.", created_at: "2026-07-22T10:15:00.000Z" },
      { id: "dev-h3", acao: "Documentos recebidos", descricao: "Cartão do CNPJ e ITR anexados ao processo.", created_at: "2026-07-24T09:05:00.000Z" },
    ],
    documentos: [
      { id: "dev-d1", categoria: "Cartão do CNPJ", nome_arquivo: "cartao-cnpj-santa-fe.pdf", status: "aprovado", url: "", created_at: "2026-07-24T09:05:00.000Z" },
      { id: "dev-d2", categoria: "ITR", nome_arquivo: "itr-2026-sorriso.pdf", status: "em_analise", url: "", created_at: "2026-07-24T09:06:00.000Z" },
      { id: "dev-d3", categoria: "LCDPR", nome_arquivo: "lcdpr-2025.xlsx", status: "pendente", url: "", created_at: "2026-07-24T09:07:00.000Z" },
    ],
  },
};

const DEV_FORM_STORE: Record<string, any> = { ...DEV_SEED };

function isDevMode() {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  return url === "" || url === "https://seu-projeto.supabase.co";
}

function findDevEntry(formularioId: string) {
  return Object.values(DEV_FORM_STORE).find((v: any) => v.formId === formularioId);
}

function devProdutor(entry: any) {
  return {
    nome_razao: entry?.nome || "Produtor",
    cpf_cnpj: entry?.cpf_cnpj || "",
    municipio: entry?.municipio || "",
    estado: entry?.estado || "",
    atividade_principal: entry?.atividade_principal || "",
    tipo: entry?.tipo || "Pessoa Física",
  };
}

function devRespostasArray(entry: any) {
  return Object.entries(entry?.respostas || {}).map(([campo, valor]) => ({ campo, valor }));
}

export async function getFormularioByCodigo(codigo: string) {
  if (isDevMode()) {
    const stored = DEV_FORM_STORE[codigo];
    if (stored) {
      return {
        link: { codigo, status: "ativo" },
        produtor: devProdutor(stored),
        formulario: { id: stored.formId, produtor_id: "dev", status_preenchimento: "em_preenchimento" },
        respostas: [],
      };
    }
    return {
      link: { codigo, status: "ativo" },
      produtor: devProdutor(null),
      formulario: { id: `dev-form-${codigo}`, produtor_id: "dev", status_preenchimento: "em_preenchimento" },
      respostas: [],
    };
  }
  const { data: link, error } = await supabase
    .from("links_formulario")
    .select("*, produtores(*)")
    .eq("codigo", codigo)
    .single();
  if (error || !link) return null;
  if (link.status !== "ativo") return null;
  if (link.data_validade && new Date(link.data_validade) < new Date()) return null;

  let { data: form } = await supabase
    .from("formularios")
    .select("*")
    .eq("link_id", link.id)
    .single();

  if (!form) {
    const { data: newForm } = await supabase
      .from("formularios")
      .insert({ produtor_id: link.produtor_id, link_id: link.id, status_preenchimento: "em_preenchimento" })
      .select()
      .single();
    form = newForm;
  }

  const { data: respostas } = await supabase
    .from("respostas")
    .select("*")
    .eq("formulario_id", form!.id);

  return { link, produtor: link.produtores, formulario: form, respostas: respostas || [] };
}

export async function getFormularioById(formularioId: string) {
  if (isDevMode()) {
    const stored = findDevEntry(formularioId);
    if (!stored) return null;
    return {
      link: { codigo: stored.codigo, status: "ativo" },
      produtor: devProdutor(stored),
      formulario: { id: stored.formId, produtor_id: "dev", status_preenchimento: stored.status || "em_preenchimento", percentual_preenchido: stored.percentual || 0, protocolo: stored.protocolo || null, data_envio: stored.data_envio || null },
      respostas: devRespostasArray(stored),
    };
  }
  const { data: form, error } = await supabase
    .from("formularios")
    .select("*, produtores(*)")
    .eq("id", formularioId)
    .single();
  if (error || !form) return null;
  const { data: respostas } = await supabase
    .from("respostas")
    .select("*")
    .eq("formulario_id", form.id);
  return { produtor: form.produtores, formulario: form, respostas: respostas || [] };
}

export async function salvarResposta(formularioId: string, etapa: number, campo: string, valor: any) {
  if (isDevMode()) {
    const entry = findDevEntry(formularioId);
    if (entry) {
      entry.respostas = entry.respostas || {};
      entry.respostas[campo] = valor;
      const totalCampos = 46;
      const preenchidos = Object.values(entry.respostas).filter((v) => v !== "" && v !== null && v !== undefined && v !== false).length;
      entry.percentual = Math.min(100, Math.round((preenchidos / totalCampos) * 100));
    }
    return;
  }
  const { data: existing } = await supabase
    .from("respostas")
    .select("id")
    .eq("formulario_id", formularioId)
    .eq("campo", campo)
    .single();

  if (existing) {
    return supabase.from("respostas").update({ valor }).eq("id", existing.id);
  }
  return supabase.from("respostas").insert({ formulario_id: formularioId, etapa, campo, valor });
}

export async function salvarMultiplasRespostas(formularioId: string, etapa: number, dados: Record<string, any>) {
  for (const [campo, valor] of Object.entries(dados)) {
    await salvarResposta(formularioId, etapa, campo, valor);
  }
}

export async function getRespostas(formularioId: string) {
  if (isDevMode()) return [];
  const { data } = await supabase.from("respostas").select("*").eq("formulario_id", formularioId);
  return data || [];
}

export async function enviarFormulario(formularioId: string) {
  const protocolo = `PROT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  if (isDevMode()) {
    const entry = findDevEntry(formularioId);
    if (entry) {
      entry.status = "formulario_enviado";
      entry.percentual = 100;
      entry.protocolo = protocolo;
      entry.data_envio = new Date().toISOString();
    }
    return protocolo;
  }
  const { error } = await supabase
    .from("formularios")
    .update({ status_preenchimento: "formulario_enviado", percentual_preenchido: 100, data_envio: new Date().toISOString(), protocolo })
    .eq("id", formularioId);
  if (error) throw error;
  return protocolo;
}

export async function getProdutores(filters?: Record<string, any>) {
  if (isDevMode()) return [];
  let query = supabase.from("produtores").select("*, formularios(*)");
  if (filters?.nome) query = query.ilike("nome_razao", `%${filters.nome}%`);
  if (filters?.estado) query = query.eq("estado", filters.estado);
  if (filters?.atividade) query = query.eq("atividade_principal", filters.atividade);
  if (filters?.tipo) query = query.eq("tipo", filters.tipo);
  const { data } = await query;
  return data || [];
}

export async function getFormulariosCompletos() {
  if (isDevMode()) {
    const forms = Object.values(DEV_FORM_STORE) as any[];
    return forms.map((f: any) => ({
      id: f.formId,
      produtor_id: "dev",
      link_id: `dev-link-${f.codigo}`,
      status_preenchimento: f.status || "cadastro_criado",
      status_diagnostico: f.status_diagnostico || "pendente",
      percentual_preenchido: f.percentual || 0,
      protocolo: f.protocolo || null,
      data_envio: f.data_envio || null,
      produtores: devProdutor(f),
    }));
  }
  const { data } = await supabase
    .from("formularios")
    .select("*, produtores(*)")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getCodigoByFormId(formId: string, _produtorId: string) {
  if (isDevMode()) {
    const found = Object.entries(DEV_FORM_STORE).find(([, v]: any) => v.formId === formId);
    return found ? found[0] : null;
  }
  const { data: form } = await supabase.from("formularios").select("link_id").eq("id", formId).single();
  if (!form) return null;
  const { data: link } = await supabase.from("links_formulario").select("codigo").eq("id", form.link_id).single();
  return link?.codigo || null;
}

export async function getFormularioCompletoById(formularioId: string) {
  if (isDevMode()) {
    const stored = findDevEntry(formularioId);
    if (!stored) return null;
    return {
      produtor: devProdutor(stored),
      formulario: {
        id: stored.formId, produtor_id: "dev", status_preenchimento: stored.status || "em_preenchimento",
        status_diagnostico: stored.status_diagnostico || "pendente", percentual_preenchido: stored.percentual || 0,
        protocolo: stored.protocolo || null, data_envio: stored.data_envio || null,
      },
      respostas: devRespostasArray(stored),
      diagnostico: stored.diagnostico || null,
      acoes: stored.acoes || [],
      oportunidades: stored.oportunidades || [],
      pendencias: stored.pendencias || [],
      observacoes: stored.observacoes || [],
      historico: stored.historico || [],
      documentos: stored.documentos || [],
    };
  }

  const { data: form, error } = await supabase
    .from("formularios")
    .select("*, produtores(*)")
    .eq("id", formularioId)
    .single();
  if (error || !form) return null;

  const [{ data: respostas }, { data: diagnostico }, { data: acoes }, { data: oportunidades }, { data: pendencias }, { data: observacoes }, { data: historico }, { data: documentos }] =
    await Promise.all([
      supabase.from("respostas").select("*").eq("formulario_id", form.id),
      supabase.from("diagnosticos").select("*").eq("formulario_id", form.id).maybeSingle(),
      supabase.from("acoes_prioritarias").select("*").eq("diagnostico_id", (await supabase.from("diagnosticos").select("id").eq("formulario_id", form.id).maybeSingle()).data?.id),
      supabase.from("oportunidades_servicos").select("*").eq("diagnostico_id", (await supabase.from("diagnosticos").select("id").eq("formulario_id", form.id).maybeSingle()).data?.id),
      supabase.from("pendencias").select("*").eq("formulario_id", form.id).order("created_at", { ascending: false }),
      supabase.from("observacoes").select("*, usuarios(nome, cargo)").eq("formulario_id", form.id).order("created_at", { ascending: false }),
      supabase.from("historico").select("*, usuarios(nome)").eq("formulario_id", form.id).order("created_at", { ascending: false }),
      supabase.from("documentos").select("*").eq("formulario_id", form.id).order("created_at", { ascending: false }),
    ]);

  return {
    produtor: form.produtores,
    formulario: form,
    respostas: respostas || [],
    diagnostico: diagnostico || null,
    acoes: acoes || [],
    oportunidades: oportunidades || [],
    pendencias: pendencias || [],
    observacoes: observacoes || [],
    historico: historico || [],
    documentos: documentos || [],
  };
}

export async function salvarDiagnosticoCompleto(
  formularioId: string,
  dados: Record<string, any>,
  acoes: { descricao: string; prazo?: string; concluida?: boolean }[],
  oportunidades: { descricao: string; prioridade?: string }[]
) {
  if (isDevMode()) {
    const entry = findDevEntry(formularioId);
    if (entry) {
      entry.diagnostico = { ...(entry.diagnostico || {}), ...dados };
      entry.acoes = acoes.map((a) => ({ id: `dev-acao-${Date.now()}-${Math.random()}`, ...a }));
      entry.oportunidades = oportunidades.map((o) => ({ id: `dev-op-${Date.now()}-${Math.random()}`, ...o }));
      entry.status_diagnostico = "concluido";
    }
    return;
  }

  const { data: existente } = await supabase
    .from("diagnosticos")
    .select("id")
    .eq("formulario_id", formularioId)
    .maybeSingle();

  let diagnosticoId: string;
  if (existente) {
    const { data, error } = await supabase
      .from("diagnosticos")
      .update(dados)
      .eq("id", existente.id)
      .select()
      .single();
    if (error) throw error;
    diagnosticoId = data.id;
  } else {
    const { data, error } = await supabase
      .from("diagnosticos")
      .insert({ formulario_id: formularioId, ...dados })
      .select()
      .single();
    if (error) throw error;
    diagnosticoId = data.id;
  }

  await supabase.from("acoes_prioritarias").delete().eq("diagnostico_id", diagnosticoId);
  if (acoes.length > 0) {
    await supabase.from("acoes_prioritarias").insert(
      acoes.map((a) => ({ diagnostico_id: diagnosticoId, descricao: a.descricao, prazo: a.prazo || null, concluida: a.concluida || false }))
    );
  }

  await supabase.from("oportunidades_servicos").delete().eq("diagnostico_id", diagnosticoId);
  if (oportunidades.length > 0) {
    await supabase.from("oportunidades_servicos").insert(
      oportunidades.map((o) => ({ diagnostico_id: diagnosticoId, descricao: o.descricao, prioridade: o.prioridade || "media" }))
    );
  }

  await supabase.from("formularios").update({ status_diagnostico: "concluido" }).eq("id", formularioId);
}

export async function salvarObservacao(formularioId: string, autorId: string | undefined, texto: string, categoria?: string, importante?: boolean) {
  if (isDevMode()) {
    const entry = findDevEntry(formularioId);
    if (entry) {
      entry.observacoes = entry.observacoes || [];
      entry.observacoes.unshift({ id: `dev-obs-${Date.now()}`, texto, categoria, importante: importante || false, created_at: new Date().toISOString() });
    }
    return;
  }
  await supabase.from("observacoes").insert({ formulario_id: formularioId, autor_id: autorId || null, texto, categoria: categoria || null, importante: importante || false });
}

export async function adicionarPendencia(formularioId: string, descricao: string, tipo: string) {
  if (isDevMode()) {
    const entry = findDevEntry(formularioId);
    if (entry) {
      entry.pendencias = entry.pendencias || [];
      entry.pendencias.unshift({ id: `dev-pen-${Date.now()}`, descricao, tipo, resolvida: false, created_at: new Date().toISOString() });
    }
    return;
  }
  await supabase.from("pendencias").insert({ formulario_id: formularioId, descricao, tipo });
}

export async function resolverPendencia(pendenciaId: string) {
  if (isDevMode()) {
    for (const entry of Object.values(DEV_FORM_STORE) as any[]) {
      const p = (entry.pendencias || []).find((x: any) => x.id === pendenciaId);
      if (p) { p.resolvida = true; return; }
    }
    return;
  }
  await supabase.from("pendencias").update({ resolvida: true }).eq("id", pendenciaId);
}

export async function criarProdutorELink(dados: ProdutorInput) {
  const codigo = `AGRO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  if (isDevMode()) {
    const formId = `dev-form-${Date.now()}`;
    DEV_FORM_STORE[codigo] = {
      formId, codigo, nome: dados.nome_razao || "Produtor",
      cpf_cnpj: dados.cpf_cnpj || "", municipio: dados.municipio || "", estado: dados.estado || "",
      atividade_principal: dados.atividade_principal || "", tipo: dados.tipo || "Pessoa Física",
      status: "cadastro_criado", percentual: 0,
    };
    return { formId, codigo, nome: dados.nome_razao || "Produtor" };
  }

  const { data: produtor, error: errProd } = await supabase
    .from("produtores")
    .insert({
      nome_razao: dados.nome_razao, cpf_cnpj: dados.cpf_cnpj, email: dados.email,
      telefone: dados.telefone, municipio: dados.municipio, estado: dados.estado,
      atividade_principal: dados.atividade_principal, tipo: dados.tipo || "Pessoa Física",
    })
    .select()
    .single();
  if (errProd) throw errProd;

  const { data: link, error: errLink } = await supabase
    .from("links_formulario")
    .insert({ produtor_id: produtor.id, codigo, status: "ativo" })
    .select()
    .single();
  if (errLink) throw errLink;

  const { data: form, error: errForm } = await supabase
    .from("formularios")
    .insert({ produtor_id: produtor.id, link_id: link.id, status_preenchimento: "cadastro_criado" })
    .select()
    .single();
  if (errForm) throw errForm;

  return { formId: form.id, codigo, nome: dados.nome_razao };
}

export async function criarProdutorEFormulario(dados: ProdutorInput) {
  if (isDevMode()) {
    const formId = `dev-form-${Date.now()}`;
    const codigo = `AGRO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    DEV_FORM_STORE[codigo] = {
      formId, codigo, nome: dados.nome_razao || "Produtor",
      cpf_cnpj: dados.cpf_cnpj || "", municipio: dados.municipio || "", estado: dados.estado || "",
      atividade_principal: dados.atividade_principal || "", tipo: dados.tipo || "Pessoa Física",
      status: "cadastro_criado", percentual: 0,
    };
    return { formId, nome: dados.nome_razao || "Produtor" };
  }

  const { data: produtor, error: errProd } = await supabase
    .from("produtores")
    .insert({
      nome_razao: dados.nome_razao, cpf_cnpj: dados.cpf_cnpj, email: dados.email,
      telefone: dados.telefone, municipio: dados.municipio, estado: dados.estado,
      atividade_principal: dados.atividade_principal, tipo: dados.tipo || "Pessoa Física",
    })
    .select()
    .single();
  if (errProd) throw errProd;

  const { data: form, error: errForm } = await supabase
    .from("formularios")
    .insert({ produtor_id: produtor.id, status_preenchimento: "cadastro_criado" })
    .select()
    .single();
  if (errForm) throw errForm;

  return { formId: form.id, nome: dados.nome_razao };
}

export async function getEstatisticas() {
  if (isDevMode()) {
    const forms = Object.values(DEV_FORM_STORE) as any[];
    return {
      total: forms.length,
      porStatus: { cadastro_criado: forms.length },
      acima3600: 0,
      porEstado: {},
      porAtividade: {},
      porMes: {},
      porReceita: { "Até R$ 3,6M": forms.length, "Acima R$ 3,6M": 0 },
    };
  }
  const { data: forms } = await supabase.from("formularios").select("*, produtores(*)");
  if (!forms) return {};
  const total = forms.length;
  const porStatus: Record<string, number> = {};
  let acima3600 = 0;
  const porEstado: Record<string, number> = {};
  const porAtividade: Record<string, number> = {};
  const porMes: Record<string, number> = {};
  const porReceita: Record<string, number> = { "Até R$ 3,6M": 0, "Acima R$ 3,6M": 0 };

  for (const f of forms) {
    porStatus[f.status_preenchimento] = (porStatus[f.status_preenchimento] || 0) + 1;
    const est = f.produtores?.estado;
    if (est) porEstado[est] = (porEstado[est] || 0) + 1;
    const atv = f.produtores?.atividade_principal;
    if (atv) porAtividade[atv] = (porAtividade[atv] || 0) + 1;
    if (f.data_envio) {
      const mes = f.data_envio.substring(0, 7);
      porMes[mes] = (porMes[mes] || 0) + 1;
    }
  }

  const { data: respostas } = await supabase.from("respostas").select("*");
  if (respostas) {
    for (const r of respostas) {
      if (r.campo === "acima_3600000_2024" && r.valor === true) acima3600++;
    }
  }

  porReceita["Acima R$ 3,6M"] = acima3600;
  porReceita["Até R$ 3,6M"] = total - acima3600;

  return { total, porStatus, acima3600, porEstado, porAtividade, porMes, porReceita };
}
