import { supabase } from './supabase';

export async function getFormularioByCodigo(codigo: string) {
  const { data: link, error } = await supabase
    .from('links_formulario')
    .select('*, produtores(*)')
    .eq('codigo', codigo)
    .single();
  if (error || !link) return null;
  if (link.status !== 'ativo') return null;
  if (link.data_validade && new Date(link.data_validade) < new Date()) return null;

  let { data: form } = await supabase
    .from('formularios')
    .select('*')
    .eq('link_id', link.id)
    .single();

  if (!form) {
    const { data: newForm } = await supabase
      .from('formularios')
      .insert({
        produtor_id: link.produtor_id,
        link_id: link.id,
        status_preenchimento: 'em_preenchimento',
      })
      .select()
      .single();
    form = newForm;
  }

  const { data: respostas } = await supabase
    .from('respostas')
    .select('*')
    .eq('formulario_id', form!.id);

  return { link, produtor: link.produtores, formulario: form, respostas: respostas || [] };
}

export async function salvarResposta(formularioId: string, etapa: number, campo: string, valor: any) {
  const { data: existing } = await supabase
    .from('respostas')
    .select('id')
    .eq('formulario_id', formularioId)
    .eq('campo', campo)
    .single();

  if (existing) {
    return supabase
      .from('respostas')
      .update({ valor })
      .eq('id', existing.id);
  }
  return supabase
    .from('respostas')
    .insert({ formulario_id: formularioId, etapa, campo, valor });
}

export async function salvarMultiplasRespostas(formularioId: string, etapa: number, dados: Record<string, any>) {
  for (const [campo, valor] of Object.entries(dados)) {
    await salvarResposta(formularioId, etapa, campo, valor);
  }
}

export async function getRespostas(formularioId: string) {
  const { data } = await supabase
    .from('respostas')
    .select('*')
    .eq('formulario_id', formularioId);
  return data || [];
}

export async function enviarFormulario(formularioId: string) {
  const protocolo = `PROT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const { error } = await supabase
    .from('formularios')
    .update({
      status_preenchimento: 'formulario_enviado',
      percentual_preenchido: 100,
      data_envio: new Date().toISOString(),
      protocolo,
    })
    .eq('id', formularioId);
  if (error) throw error;
  return protocolo;
}

export async function getProdutores(filters?: Record<string, any>) {
  let query = supabase
    .from('produtores')
    .select('*, formularios(*)');

  if (filters?.nome) {
    query = query.ilike('nome_razao', `%${filters.nome}%`);
  }
  if (filters?.estado) {
    query = query.eq('estado', filters.estado);
  }
  if (filters?.atividade) {
    query = query.eq('atividade_principal', filters.atividade);
  }
  if (filters?.tipo) {
    query = query.eq('tipo', filters.tipo);
  }

  const { data } = await query;
  return data || [];
}

export async function getFormulariosCompletos() {
  const { data } = await supabase
    .from('formularios')
    .select('*, produtores(*)')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getEstatisticas() {
  const { data: forms } = await supabase.from('formularios').select('*, produtores(*)');
  if (!forms) return {};
  const total = forms.length;
  const porStatus: Record<string, number> = {};
  let acima3600 = 0;
  const porEstado: Record<string, number> = {};
  const porAtividade: Record<string, number> = {};
  const porMes: Record<string, number> = {};
  const porReceita: Record<string, number> = { 'Até R$ 3,6M': 0, 'Acima R$ 3,6M': 0 };

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

  const { data: respostas } = await supabase.from('respostas').select('*');
  if (respostas) {
    for (const r of respostas) {
      if (r.campo === 'acima_3600000_2024' && r.valor === true) {
        acima3600++;
      }
    }
  }

  porReceita['Acima R$ 3,6M'] = acima3600;
  porReceita['Até R$ 3,6M'] = total - acima3600;

  return {
    total,
    porStatus,
    acima3600,
    porEstado,
    porAtividade,
    porMes,
    porReceita,
  };
}
