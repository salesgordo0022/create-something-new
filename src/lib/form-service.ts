import { supabase } from "./supabase";

interface ProdutorInput {
  nome_razao: string; cpf_cnpj?: string; email?: string; telefone?: string;
  municipio?: string; estado?: string; atividade_principal?: string; tipo?: string;
}

const DEV_FORM_STORE: Record<string, any> = {};

function isDevMode() {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  return url === "" || url === "https://seu-projeto.supabase.co";
}

function findDevEntry(formularioId: string) {
  return Object.values(DEV_FORM_STORE).find((v: any) => v.formId === formularioId);
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
        produtor: { nome_razao: stored.nome, cpf_cnpj: "", municipio: "", estado: "", atividade_principal: "", tipo: "Pessoa Física" },
        formulario: { id: stored.formId, produtor_id: "dev", status_preenchimento: "em_preenchimento" },
        respostas: [],
      };
    }
    return {
      link: { codigo, status: "ativo" },
      produtor: { nome_razao: "Produtor", cpf_cnpj: "", municipio: "", estado: "", atividade_principal: "", tipo: "Pessoa Física" },
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
      produtor: { nome_razao: stored.nome, cpf_cnpj: "", municipio: "", estado: "", atividade_principal: "", tipo: "Pessoa Física" },
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
      status_diagnostico: "pendente",
      percentual_preenchido: f.percentual || 0,
      protocolo: null,
      data_envio: null,
      produtores: { nome_razao: f.nome, cpf_cnpj: "", municipio: "", estado: "", atividade_principal: "", tipo: "" },
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
      produtor: { nome_razao: stored.nome, cpf_cnpj: "", municipio: "", estado: "", atividade_principal: "", tipo: "" },
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
    DEV_FORM_STORE[codigo] = { formId, codigo, nome: dados.nome_razao || "Produtor", status: "cadastro_criado", percentual: 0 };
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
    DEV_FORM_STORE[codigo] = { formId, codigo, nome: dados.nome_razao || "Produtor", status: "cadastro_criado", percentual: 0 };
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
