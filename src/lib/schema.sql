-- Diagnóstico Tributário do Agronegócio - Schema Completo

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Tabela de usuários (equipe interna)
create table usuarios (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  nome text not null,
  cargo text,
  avatar_url text,
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de produtores
create table produtores (
  id uuid primary key default uuid_generate_v4(),
  nome_razao text not null,
  cpf_cnpj text,
  tipo text check (tipo in ('Pessoa Física', 'Pessoa Jurídica', 'Produtor Integrado', 'Cooperativa', 'Agroindústria')),
  atividade_principal text,
  atividade_outra text,
  estados_operacao text[],
  possui_mult_estados boolean default false,
  possui_ie boolean default false,
  ie_numero text,
  possui_caepf boolean default false,
  caepf_numero text,
  telefone text,
  whatsapp text,
  email text,
  municipio text,
  estado text,
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de links para formulário
create table links_formulario (
  id uuid primary key default uuid_generate_v4(),
  produtor_id uuid references produtores(id) on delete cascade,
  codigo text unique not null default encode(gen_random_bytes(16), 'hex'),
  data_criacao timestamptz default now(),
  data_validade timestamptz,
  status text default 'ativo' check (status in ('ativo', 'bloqueado', 'expirado')),
  enviado_em timestamptz,
  enviado_por uuid references usuarios(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de formulários
create table formularios (
  id uuid primary key default uuid_generate_v4(),
  produtor_id uuid references produtores(id) on delete cascade,
  link_id uuid references links_formulario(id) on delete set null,
  status_preenchimento text default 'cadastro_criado' check (status_preenchimento in (
    'cadastro_criado', 'link_enviado', 'aguardando_preenchimento', 'em_preenchimento',
    'formulario_enviado', 'em_analise', 'aguardando_documentos', 'aguardando_retorno_produtor',
    'reuniao_agendada', 'diagnostico_concluido', 'apresentado_ao_produtor', 'arquivado'
  )),
  status_diagnostico text default 'pendente' check (status_diagnostico in ('pendente', 'em_andamento', 'concluido')),
  percentual_preenchido integer default 0,
  protocolo text,
  data_envio timestamptz,
  data_analise timestamptz,
  responsavel_interno_id uuid references usuarios(id),
  observacoes_gerais text,
  consentimento_lgpd boolean default false,
  informacoes_verdadeiras boolean default false,
  aceite_privacidade boolean default false,
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de respostas do formulário
create table respostas (
  id uuid primary key default uuid_generate_v4(),
  formulario_id uuid references formularios(id) on delete cascade,
  etapa integer not null,
  campo text not null,
  valor jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(formulario_id, campo)
);

-- Tabela de documentos
create table documentos (
  id uuid primary key default uuid_generate_v4(),
  formulario_id uuid references formularios(id) on delete cascade,
  produtor_id uuid references produtores(id) on delete cascade,
  categoria text not null,
  nome_arquivo text not null,
  url text not null,
  tamanho integer,
  tipo_arquivo text,
  descricao text,
  status text default 'recebido' check (status in ('recebido', 'em_analise', 'aprovado', 'rejeitado', 'vencido', 'pendente')),
  observacao text,
  obrigatorio boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de diagnósticos
create table diagnosticos (
  id uuid primary key default uuid_generate_v4(),
  formulario_id uuid references formularios(id) on delete cascade,
  enquadramento_ibs_cbs text check (enquadramento_ibs_cbs in ('Contribuinte obrigatório', 'Não contribuinte', 'Opção voluntária', 'Necessita de análise adicional')),
  justificativa_enquadramento text,
  nivel_risco text check (nivel_risco in ('Baixo', 'Médio', 'Alto', 'Crítico')),
  parecer_conclusivo text,
  data_diagnostico timestamptz,
  responsavel_id uuid references usuarios(id),
  data_prevista_retorno timestamptz,
  proxima_acao text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de ações prioritárias
create table acoes_prioritarias (
  id uuid primary key default uuid_generate_v4(),
  diagnostico_id uuid references diagnosticos(id) on delete cascade,
  descricao text not null,
  prazo timestamptz,
  concluida boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de oportunidades de serviços
create table oportunidades_servicos (
  id uuid primary key default uuid_generate_v4(),
  diagnostico_id uuid references diagnosticos(id) on delete cascade,
  descricao text not null,
  prioridade text check (prioridade in ('alta', 'media', 'baixa')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de pendências
create table pendencias (
  id uuid primary key default uuid_generate_v4(),
  formulario_id uuid references formularios(id) on delete cascade,
  descricao text not null,
  tipo text check (tipo in ('documento', 'informacao', 'outro')),
  resolvida boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de observações internas
create table observacoes (
  id uuid primary key default uuid_generate_v4(),
  formulario_id uuid references formularios(id) on delete cascade,
  autor_id uuid references usuarios(id),
  texto text not null,
  categoria text,
  importante boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de histórico
create table historico (
  id uuid primary key default uuid_generate_v4(),
  formulario_id uuid references formularios(id) on delete cascade,
  produtor_id uuid references produtores(id),
  usuario_id uuid references usuarios(id),
  acao text not null,
  descricao text,
  valores_anteriores jsonb,
  valores_novos jsonb,
  created_at timestamptz default now()
);

-- Tabela de notificações
create table notificacoes (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid references usuarios(id),
  formulario_id uuid references formularios(id),
  tipo text not null,
  mensagem text not null,
  lida boolean default false,
  created_at timestamptz default now()
);

-- Criar bucket de storage para documentos
-- Execute no SQL Editor do Supabase:
-- insert into storage.buckets (id, name, public) values ('documentos', 'documentos', false);

-- Políticas de Row Level Security
alter table usuarios enable row level security;
alter table produtores enable row level security;
alter table formularios enable row level security;
alter table respostas enable row level security;
alter table documentos enable row level security;
alter table diagnosticos enable row level security;
alter table acoes_prioritarias enable row level security;
alter table oportunidades_servicos enable row level security;
alter table pendencias enable row level security;
alter table observacoes enable row level security;
alter table historico enable row level security;
alter table notificacoes enable row level security;
alter table links_formulario enable row level security;

-- Políticas: apenas usuários autenticados podem ler/escrever
create policy "Usuários autenticados podem ler usuarios"
  on usuarios for select using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem inserir usuarios"
  on usuarios for insert with check (auth.role() = 'authenticated');

create policy "Usuários autenticados podem atualizar usuarios"
  on usuarios for update using (auth.role() = 'authenticated');

-- Políticas para produtores
create policy "Usuários autenticados podem gerenciar produtores"
  on produtores for all using (auth.role() = 'authenticated');

-- Políticas para formulários: autenticados e produtor com link
create policy "Usuários autenticados podem gerenciar formularios"
  on formularios for all using (auth.role() = 'authenticated');

create policy "Produtor pode ler formulario pelo link"
  on formularios for select using (
    exists (
      select 1 from links_formulario lf
      where lf.id = link_id and lf.status = 'ativo'
    )
  );

-- Políticas para respostas
create policy "Usuários autenticados podem gerenciar respostas"
  on respostas for all using (auth.role() = 'authenticated');

create policy "Produtor pode gerenciar respostas pelo link"
  on respostas for all using (
    exists (
      select 1 from formularios f
      join links_formulario lf on lf.id = f.link_id
      where f.id = formulario_id and lf.status = 'ativo'
    )
  );

-- Políticas para documentos
create policy "Usuários autenticados podem gerenciar documentos"
  on documentos for all using (auth.role() = 'authenticated');

-- Políticas para diagnósticos
create policy "Usuários autenticados podem gerenciar diagnosticos"
  on diagnosticos for all using (auth.role() = 'authenticated');

-- Políticas para demais tabelas
create policy "Usuários autenticados podem gerenciar acoes_prioritarias"
  on acoes_prioritarias for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem gerenciar oportunidades_servicos"
  on oportunidades_servicos for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem gerenciar pendencias"
  on pendencias for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem gerenciar observacoes"
  on observacoes for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem ler historico"
  on historico for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem gerenciar notificacoes"
  on notificacoes for all using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem gerenciar links_formulario"
  on links_formulario for all using (auth.role() = 'authenticated');

-- Índices
create index idx_formularios_status on formularios(status_preenchimento);
create index idx_formularios_produtor on formularios(produtor_id);
create index idx_respostas_formulario on respostas(formulario_id);
create index idx_documentos_formulario on documentos(formulario_id);
create index idx_historico_formulario on historico(formulario_id);
create index idx_notificacoes_usuario on notificacoes(usuario_id);
create index idx_links_codigo on links_formulario(codigo);

-- Trigger para updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_usuarios_updated_at before update on usuarios
  for each row execute function update_updated_at();
create trigger update_produtores_updated_at before update on produtores
  for each row execute function update_updated_at();
create trigger update_formularios_updated_at before update on formularios
  for each row execute function update_updated_at();
create trigger update_respostas_updated_at before update on respostas
  for each row execute function update_updated_at();
create trigger update_documentos_updated_at before update on documentos
  for each row execute function update_updated_at();
create trigger update_diagnosticos_updated_at before update on diagnosticos
  for each row execute function update_updated_at();
create trigger update_acoes_updated_at before update on acoes_prioritarias
  for each row execute function update_updated_at();
create trigger update_oportunidades_updated_at before update on oportunidades_servicos
  for each row execute function update_updated_at();
create trigger update_pendencias_updated_at before update on pendencias
  for each row execute function update_updated_at();
create trigger update_observacoes_updated_at before update on observacoes
  for each row execute function update_updated_at();
create trigger update_links_updated_at before update on links_formulario
  for each row execute function update_updated_at();
