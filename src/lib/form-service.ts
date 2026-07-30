import { supabase, isConfigured } from "./supabase";

const DEMO_FORMULARIOS = [
  { id: "demo-1", produtor_id: "demo-p1", status_preenchimento: "formulario_enviado", status_diagnostico: "concluido", percentual_preenchido: 100, protocolo: "PROT-0001", data_envio: "2026-07-28T10:30:00Z", produtores: { nome_razao: "João Antônio da Silva", cpf_cnpj: "123.456.789-00", municipio: "Sorriso", estado: "MT", atividade_principal: "Soja", tipo: "Pessoa Física" } },
  { id: "demo-2", produtor_id: "demo-p2", status_preenchimento: "em_analise", status_diagnostico: "em_andamento", percentual_preenchido: 100, protocolo: "PROT-0002", data_envio: "2026-07-25T14:00:00Z", produtores: { nome_razao: "Fazenda Boa Vista Ltda", cpf_cnpj: "11.222.333/0001-44", municipio: "Cascavel", estado: "PR", atividade_principal: "Milho", tipo: "Pessoa Jurídica" } },
  { id: "demo-3", produtor_id: "demo-p3", status_preenchimento: "aguardando_preenchimento", status_diagnostico: "pendente", percentual_preenchido: 0, produtores: { nome_razao: "Cooperativa Nova Era", cpf_cnpj: "22.333.444/0001-55", municipio: "Campo Grande", estado: "MS", atividade_principal: "Pecuária", tipo: "Cooperativa" } },
  { id: "demo-4", produtor_id: "demo-p4", status_preenchimento: "em_preenchimento", status_diagnostico: "pendente", percentual_preenchido: 35, produtores: { nome_razao: "Maria Helena de Souza", cpf_cnpj: "987.654.321-00", municipio: "Alfenas", estado: "MG", atividade_principal: "Leite", tipo: "Pessoa Física" } },
  { id: "demo-5", produtor_id: "demo-p5", status_preenchimento: "formulario_enviado", status_diagnostico: "concluido", percentual_preenchido: 100, protocolo: "PROT-0003", data_envio: "2026-07-20T09:15:00Z", produtores: { nome_razao: "Agroindústria Verde Campo S.A.", cpf_cnpj: "33.444.555/0001-66", municipio: "Juazeiro", estado: "BA", atividade_principal: "Fruticultura", tipo: "Agroindústria" } },
  { id: "demo-6", produtor_id: "demo-p6", status_preenchimento: "em_analise", status_diagnostico: "em_andamento", percentual_preenchido: 100, protocolo: "PROT-0004", data_envio: "2026-07-18T16:45:00Z", produtores: { nome_razao: "Roberto Carlos Mendes", cpf_cnpj: "555.666.777-88", municipio: "Chapecó", estado: "SC", atividade_principal: "Avicultura", tipo: "Produtor Integrado" } },
  { id: "demo-7", produtor_id: "demo-p7", status_preenchimento: "diagnostico_concluido", status_diagnostico: "concluido", percentual_preenchido: 100, protocolo: "PROT-0005", data_envio: "2026-07-15T11:20:00Z", produtores: { nome_razao: "Fazenda São João Arrendamentos", cpf_cnpj: "44.555.666/0001-77", municipio: "Sinop", estado: "MT", atividade_principal: "Soja", tipo: "Pessoa Jurídica" } },
  { id: "demo-8", produtor_id: "demo-p8", status_preenchimento: "em_preenchimento", status_diagnostico: "pendente", percentual_preenchido: 60, produtores: { nome_razao: "José Pereira Oliveira", cpf_cnpj: "111.222.333-44", municipio: "Passo Fundo", estado: "RS", atividade_principal: "Suinocultura", tipo: "Pessoa Física" } },
];

export async function getFormularioByCodigo(codigo: string) {
  if (!isConfigured) return null;
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

export async function salvarResposta(formularioId: string, etapa: number, campo: string, valor: any) {
  if (!isConfigured) return;
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
  if (!isConfigured) return [];
  const { data } = await supabase.from("respostas").select("*").eq("formulario_id", formularioId);
  return data || [];
}

export async function enviarFormulario(formularioId: string) {
  const protocolo = `PROT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  if (!isConfigured) return protocolo;
  const { error } = await supabase
    .from("formularios")
    .update({ status_preenchimento: "formulario_enviado", percentual_preenchido: 100, data_envio: new Date().toISOString(), protocolo })
    .eq("id", formularioId);
  if (error) throw error;
  return protocolo;
}

export async function getProdutores(filters?: Record<string, any>) {
  if (!isConfigured) return [];
  let query = supabase.from("produtores").select("*, formularios(*)");
  if (filters?.nome) query = query.ilike("nome_razao", `%${filters.nome}%`);
  if (filters?.estado) query = query.eq("estado", filters.estado);
  if (filters?.atividade) query = query.eq("atividade_principal", filters.atividade);
  if (filters?.tipo) query = query.eq("tipo", filters.tipo);
  const { data } = await query;
  return data || [];
}

export async function getFormulariosCompletos() {
  if (!isConfigured) return DEMO_FORMULARIOS;
  const { data } = await supabase
    .from("formularios")
    .select("*, produtores(*)")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getEstatisticas() {
  if (!isConfigured) {
    return {
      total: DEMO_FORMULARIOS.length,
      porStatus: {
        formulario_enviado: 2,
        em_analise: 2,
        aguardando_preenchimento: 1,
        em_preenchimento: 2,
        diagnostico_concluido: 1,
      },
      acima3600: 5,
      porEstado: { MT: 2, PR: 1, MS: 1, MG: 1, BA: 1, SC: 1, RS: 1 },
      porAtividade: { Soja: 2, Milho: 1, Pecuária: 1, Leite: 1, Fruticultura: 1, Avicultura: 1, Suinocultura: 1 },
      porMes: { "2026-07": 5, "2026-06": 3 },
      porReceita: { "Até R$ 3,6M": 3, "Acima R$ 3,6M": 5 },
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
