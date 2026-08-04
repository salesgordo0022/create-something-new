import { supabase } from './supabase';

export async function seedDatabase() {
  const { data: existing } = await supabase.from('produtores').select('id').limit(1);
  if (existing && existing.length > 0) return;

  type SeedProdutor = {
    nome_razao: string; cpf_cnpj: string; tipo: string; atividade_principal: string;
    estados_operacao?: string[]; possui_mult_estados?: boolean; possui_ie?: boolean; ie_numero?: string;
    possui_caepf?: boolean; caepf_numero?: string; telefone?: string; whatsapp?: string;
    email?: string; municipio?: string; estado?: string;
  };
  const produtores: SeedProdutor[] = [
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

    const receita = receitas[idx];
    const exportacao = Math.round(receita * (0.15 + (idx % 4) * 0.08));

    await supabase.from('respostas').insert([
      { formulario_id: form.id, etapa: 1, campo: 'etapa1_nome', valor: p.nome_razao },
      { formulario_id: form.id, etapa: 1, campo: 'etapa1_cpf_cnpj', valor: p.cpf_cnpj },
      { formulario_id: form.id, etapa: 1, campo: 'etapa1_tipo', valor: p.tipo },
      { formulario_id: form.id, etapa: 1, campo: 'etapa1_atividade', valor: p.atividade_principal },
      { formulario_id: form.id, etapa: 1, campo: 'etapa1_estados_operacao', valor: (p.estados_operacao || []).join(', ') },
      { formulario_id: form.id, etapa: 1, campo: 'etapa1_mult_estados', valor: p.possui_mult_estados },
      { formulario_id: form.id, etapa: 1, campo: 'etapa1_possui_ie', valor: p.possui_ie },
      { formulario_id: form.id, etapa: 1, campo: 'etapa1_ie_numero', valor: p.ie_numero },
      { formulario_id: form.id, etapa: 1, campo: 'etapa1_possui_caepf', valor: p.possui_caepf },
      { formulario_id: form.id, etapa: 1, campo: 'etapa1_caepf_numero', valor: p.caepf_numero },
      { formulario_id: form.id, etapa: 2, campo: 'etapa2_receita_2024', valor: Math.round(receita * 0.94) },
      { formulario_id: form.id, etapa: 2, campo: 'etapa2_exportacao_2024', valor: Math.round(receita * 0.94 * (0.1 + (idx % 5) * 0.07)) },
      { formulario_id: form.id, etapa: 2, campo: 'etapa2_receita_2026', valor: receita },
      { formulario_id: form.id, etapa: 2, campo: 'etapa2_exportacao_2026', valor: exportacao },
      { formulario_id: form.id, etapa: 2, campo: 'etapa2_receitas_nao_rurais', valor: idx % 3 === 0 },
      { formulario_id: form.id, etapa: 3, campo: 'etapa3_vende_para', valor: ['Indústria/agroindústria', 'Cooperativa', 'Trading/exportadora', 'Atacado/distribuidor'][idx % 4] },
      { formulario_id: form.id, etapa: 3, campo: 'etapa3_exporta', valor: idx % 2 === 0 },
      { formulario_id: form.id, etapa: 3, campo: 'etapa3_vende_trading', valor: receita > 3600000 },
      { formulario_id: form.id, etapa: 3, campo: 'etapa3_integrado', valor: p.tipo === 'Produtor Integrado' },
      { formulario_id: form.id, etapa: 3, campo: 'etapa3_cooperativa', valor: p.tipo === 'Cooperativa' },
      { formulario_id: form.id, etapa: 3, campo: 'etapa3_nao_contribuintes', valor: idx % 4 === 1 },
      { formulario_id: form.id, etapa: 3, campo: 'etapa3_insumos', valor: ['Sementes, defensivos e fertilizantes', 'Ração e medicamentos veterinários', 'Fertilizantes e corretivos', 'Mudas e defensivos'][idx % 4] },
      { formulario_id: form.id, etapa: 3, campo: 'etapa3_maquinas', valor: idx % 2 === 0 },
      { formulario_id: form.id, etapa: 3, campo: 'etapa3_freq_aquisicoes', valor: ['Anualmente', 'A cada safra', 'Trimestralmente'][idx % 3] },
      { formulario_id: form.id, etapa: 4, campo: 'etapa4_emite_nfe', valor: receita > 2000000 },
      { formulario_id: form.id, etapa: 4, campo: 'etapa4_software_fiscal', valor: ['Sistema próprio', 'ERP terceirizado', 'Contabilidade terceirizada'][idx % 3] },
      { formulario_id: form.id, etapa: 4, campo: 'etapa4_escrituracao', valor: ['Livro Caixa', 'Escrituração completa', 'Outra'][idx % 3] },
      { formulario_id: form.id, etapa: 4, campo: 'etapa4_funrural', valor: true },
      { formulario_id: form.id, etapa: 4, campo: 'etapa4_funrural_modalidade', valor: ['3,05% sobre a receita', 'Alíquota sobre a folha'][idx % 2] },
      { formulario_id: form.id, etapa: 4, campo: 'etapa4_fundo_estadual', valor: idx % 3 === 0 },
      { formulario_id: form.id, etapa: 4, campo: 'etapa4_gestao_financeira', valor: receita > 3000000 },
      { formulario_id: form.id, etapa: 4, campo: 'etapa4_outras_atividades', valor: idx % 4 === 2 },
      { formulario_id: form.id, etapa: 4, campo: 'etapa4_debitos', valor: idx % 5 === 4 },
      { formulario_id: form.id, etapa: 4, campo: 'etapa4_parcelamentos', valor: idx % 7 === 3 },
      { formulario_id: form.id, etapa: 4, campo: 'etapa4_certidoes', valor: idx % 3 !== 1 },
      { formulario_id: form.id, etapa: 5, campo: 'etapa5_imovel_proprio', valor: true },
      { formulario_id: form.id, etapa: 5, campo: 'etapa5_hectares_proprios', valor: 150 + idx * 120 },
      { formulario_id: form.id, etapa: 5, campo: 'etapa5_arrendada', valor: idx % 2 === 0 },
      { formulario_id: form.id, etapa: 5, campo: 'etapa5_hectares_arrendados', valor: 80 + idx * 40 },
      { formulario_id: form.id, etapa: 5, campo: 'etapa5_holding', valor: idx % 4 === 1 },
      { formulario_id: form.id, etapa: 5, campo: 'etapa5_socios', valor: idx % 3 === 0 },
      { formulario_id: form.id, etapa: 5, campo: 'etapa5_seguro', valor: idx % 2 === 0 },
      { formulario_id: form.id, etapa: 5, campo: 'etapa5_financiamentos', valor: receita > 2500000 },
      { formulario_id: form.id, etapa: 5, campo: 'etapa5_contratos', valor: idx % 2 === 0 },
      { formulario_id: form.id, etapa: 5, campo: 'etapa5_sucessorio', valor: idx % 4 === 2 },
      { formulario_id: form.id, etapa: 7, campo: 'etapa7_consentimento', valor: true },
      { formulario_id: form.id, etapa: 7, campo: 'etapa7_informacoes_verdadeiras', valor: true },
      { formulario_id: form.id, etapa: 7, campo: 'etapa7_aceite_privacidade', valor: true },
    ]);

    if (statuses[idx] === 'formulario_enviado' || statuses[idx] === 'em_analise') {
      await supabase.from('diagnosticos').insert({
        formulario_id: form.id,
        enquadramento_ibs_cbs: receita > 3600000 ? 'Contribuinte obrigatório' : 'Não contribuinte',
        nivel_risco: receita > 5000000 ? 'Alto' : receita > 2000000 ? 'Médio' : 'Baixo',
        justificativa_enquadramento: receita > 3600000
          ? 'Receita bruta anual superior ao limite de R$ 3,6 milhões, enquadrando-se como contribuinte obrigatório do IBS/CBS.'
          : 'Receita bruta anual dentro do limite de R$ 3,6 milhões, sem obrigatoriedade de contribuição do IBS/CBS.',
        parecer_conclusivo: 'Produtor enquadrado conforme análise preliminar. Recomenda-se planejamento tributário detalhado.',
        data_diagnostico: new Date().toISOString(),
        data_prevista_retorno: new Date(Date.now() + 15 * 86400000).toISOString(),
        proxima_acao: 'Agendar reunião de apresentação do parecer ao produtor.',
      });
    }
  }
}
