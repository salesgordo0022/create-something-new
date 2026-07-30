import { supabase } from './supabase';

export async function seedDatabase() {
  const { data: existing } = await supabase.from('produtores').select('id').limit(1);
  if (existing && existing.length > 0) return;

  const produtores = [
    { nome_razao: 'João Antônio da Silva', cpf_cnpj: '123.456.789-00', tipo: 'Pessoa Física', atividade_principal: 'Soja', estados_operacao: ['MT', 'GO'], possui_mult_estados: true, possui_ie: true, ie_numero: '123456789', telefone: '(66) 99999-1234', whatsapp: '(66) 99999-1234', email: 'joao.silva@email.com', municipio: 'Sorriso', estado: 'MT' },
    { nome_razao: 'Fazenda Boa Vista Ltda', cpf_cnpj: '11.222.333/0001-44', tipo: 'Pessoa Jurídica', atividade_principal: 'Milho', estados_operacao: ['PR'], possui_ie: true, ie_numero: '987654321', telefone: '(44) 98888-5678', whatsapp: '(44) 98888-5678', email: 'contato@boavista.com', municipio: 'Cascavel', estado: 'PR' },
    { nome_razao: 'Cooperativa Agropecuária Nova Era', cpf_cnpj: '22.333.444/0001-55', tipo: 'Cooperativa', atividade_principal: 'Pecuária', estados_operacao: ['MS', 'SP'], possui_mult_estados: true, possui_ie: true, ie_numero: '456789123', telefone: '(67) 97777-9012', whatsapp: '(67) 97777-9012', email: 'admin@novaera.coop', municipio: 'Campo Grande', estado: 'MS' },
    { nome_razao: 'Maria Helena de Souza', cpf_cnpj: '987.654.321-00', tipo: 'Pessoa Física', atividade_principal: 'Leite', estados_operacao: ['MG'], possui_caepf: true, caepf_numero: 'CAEPF123456', telefone: '(35) 96666-3456', whatsapp: '(35) 96666-3456', email: 'mhelena@email.com', municipio: 'Alfenas', estado: 'MG' },
    { nome_razao: 'Agroindústria Verde Campo S.A.', cpf_cnpj: '33.444.555/0001-66', tipo: 'Agroindústria', atividade_principal: 'Fruticultura', estados_operacao: ['BA', 'PE', 'CE'], possui_mult_estados: true, possui_ie: true, ie_numero: '789123456', telefone: '(77) 95555-7890', whatsapp: '(77) 95555-7890', email: 'comercial@verdecampo.agr', municipio: 'Juazeiro', estado: 'BA' },
    { nome_razao: 'Roberto Carlos Mendes', cpf_cnpj: '555.666.777-88', tipo: 'Produtor Integrado', atividade_principal: 'Avicultura', estados_operacao: ['SC'], possui_ie: true, ie_numero: '321654987', telefone: '(47) 94444-1234', whatsapp: '(47) 94444-1234', email: 'roberto.mendes@email.com', municipio: 'Chapecó', estado: 'SC' },
    { nome_razao: 'Fazenda São João Arrendamentos Ltda', cpf_cnpj: '44.555.666/0001-77', tipo: 'Pessoa Jurídica', atividade_principal: 'Soja', estados_operacao: ['MT', 'PA'], possui_mult_estados: true, possui_ie: true, ie_numero: '654987321', telefone: '(66) 93333-5678', whatsapp: '(66) 93333-5678', email: 'adm@saocjoao.com', municipio: 'Sinop', estado: 'MT' },
    { nome_razao: 'José Pereira Oliveira', cpf_cnpj: '111.222.333-44', tipo: 'Pessoa Física', atividade_principal: 'Suinocultura', estados_operacao: ['RS'], possui_ie: false, telefone: '(54) 92222-9012', whatsapp: '(54) 92222-9012', email: 'jose.pereira@email.com', municipio: 'Passo Fundo', estado: 'RS' },
  ];

  for (const p of produtores) {
    const { data: prod, error } = await supabase.from('produtores').insert(p).select().single();
    if (error || !prod) continue;

    const codigo = crypto.randomUUID().replace(/-/g, '');
    const { data: link } = await supabase.from('links_formulario').insert({
      produtor_id: prod.id,
      codigo,
      data_validade: new Date(Date.now() + 90 * 86400000).toISOString(),
      status: 'ativo',
    }).select().single();

    if (!link) continue;

    const receitas = [1800000, 5200000, 4500000, 890000, 7200000, 2100000, 6800000, 950000];
    const statuses = ['aguardando_preenchimento', 'formulario_enviado', 'em_analise', 'em_preenchimento', 'formulario_enviado', 'aguardando_preenchimento', 'em_analise', 'em_preenchimento'];
    const idx = produtores.indexOf(p);

    const { data: form } = await supabase.from('formularios').insert({
      produtor_id: prod.id,
      link_id: link.id,
      status_preenchimento: statuses[idx],
      percentual_preenchido: statuses[idx] === 'formulario_enviado' ? 100 : statuses[idx] === 'em_analise' ? 100 : Math.floor(Math.random() * 60 + 20),
      data_envio: statuses[idx] === 'formulario_enviado' || statuses[idx] === 'em_analise' ? new Date().toISOString() : null,
      protocolo: statuses[idx] === 'formulario_enviado' || statuses[idx] === 'em_analise' ? `PROT-${String(idx + 1).padStart(4, '0')}` : null,
    }).select().single();

    if (!form) continue;

    await supabase.from('respostas').insert([
      { formulario_id: form.id, etapa: 1, campo: 'receita_bruta_2024', valor: receitas[idx] },
      { formulario_id: form.id, etapa: 2, campo: 'receita_bruta_2026', valor: receitas[idx] },
      { formulario_id: form.id, etapa: 2, campo: 'acima_3600000_2024', valor: receitas[idx] > 3600000 },
      { formulario_id: form.id, etapa: 2, campo: 'acima_3600000_2026', valor: receitas[idx] > 3600000 },
      { formulario_id: form.id, etapa: 2, campo: 'regime_tributario', valor: 'Lucro Presumido' },
      { formulario_id: form.id, etapa: 4, campo: 'emite_nfe', valor: true },
    ]);

    if (statuses[idx] === 'formulario_enviado' || statuses[idx] === 'em_analise') {
      await supabase.from('diagnosticos').insert({
        formulario_id: form.id,
        enquadramento_ibs_cbs: receitas[idx] > 3600000 ? 'Contribuinte obrigatório' : 'Não contribuinte',
        nivel_risco: receitas[idx] > 5000000 ? 'Alto' : receitas[idx] > 2000000 ? 'Médio' : 'Baixo',
        parecer_conclusivo: 'Produtor enquadrado conforme análise preliminar. Recomenda-se planejamento tributário detalhado.',
        data_diagnostico: new Date().toISOString(),
      });
    }
  }
}
