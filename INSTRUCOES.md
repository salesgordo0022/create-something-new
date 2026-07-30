# Diagnóstico Tributário do Agronegócio

Sistema completo para diagnóstico e planejamento tributário de produtores rurais.

## Tecnologias

- React 19 + TypeScript
- TanStack Start (SSR)
- Tailwind CSS v4
- Supabase (Banco, Auth, Storage)
- Recharts (Gráficos)
- jsPDF (Relatórios)

## Estrutura de Arquivos

```
src/
├── lib/
│   ├── supabase.ts          # Conexão Supabase
│   ├── auth-context.tsx     # Contexto de autenticação
│   ├── form-service.ts      # Serviços do formulário
│   ├── pdf-service.ts       # Geração de PDF
│   ├── masks.ts             # Máscaras (CPF, CNPJ, telefone)
│   ├── types.ts             # Tipos TypeScript
│   ├── schema.sql           # Script SQL completo
│   └── seed.ts              # Dados de demonstração
├── routes/
│   ├── __root.tsx           # Layout raiz
│   ├── index.tsx            # Página inicial (redireciona)
│   ├── login.tsx            # Login da equipe
│   ├── formulario.$codigo.tsx # Formulário do produtor (7 etapas)
│   ├── gestao.index.tsx     # Painel de gestão
│   └── gestao.$id.tsx       # Diagnóstico individual
└── components/
    ├── ui/                  # Componentes shadcn/ui
    ├── form/                # Componentes do formulário
    └── gestao/              # Componentes da gestão
```

## Configuração

### 1. Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. No SQL Editor, execute o conteúdo de `src/lib/schema.sql`
4. Em Authentication > Settings, habilite "Email + Password"
5. Em Storage, crie um bucket chamado `documentos`
6. Vá em Project Settings > API e copie a URL e Anon Key

### 2. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Executar

```bash
npm run dev
```

### 5. Criar Usuário Admin

1. Acesse a página de Authentication do Supabase
2. Adicione um novo usuário (email/senha)
3. No SQL Editor, insira o usuário na tabela `usuarios`:
```sql
insert into usuarios (id, email, nome, cargo)
values ('ID_DO_USUARIO_AUTH', 'email@exemplo.com', 'Admin', 'Administrador');
```

### 6. Dados de Demonstração

Opção 1 - Via SQL (recomendado após configurar Supabase):
```bash
npm run dev
# Acesse /api/seed para popular dados de demonstração
```

Opção 2 - Automaticamente via interface:
- Após fazer login, o sistema criará dados de demonstração automaticamente

## Rotas

| Rota | Descrição | Acesso |
|------|-----------|--------|
| `/login` | Login da equipe interna | Público |
| `/formulario/:codigo` | Formulário do produtor | Via link único |
| `/gestao` | Painel de gestão | Autenticado |
| `/gestao/:id` | Diagnóstico individual | Autenticado |

## Funcionalidades

### Módulo 1 - Formulário do Produtor
- 7 etapas com barra de progresso
- Salvamento automático a cada 30s
- Máscaras de CPF/CNPJ/Telefone
- Upload de documentos (drag & drop)
- Revisão antes do envio
- Geração de protocolo
- Bloqueio pós-envio

### Módulo 2 - Gestão dos Diagnósticos
- Painel com indicadores e gráficos
- Tabela com filtros
- 6 abas por diagnóstico (Resumo, Respostas, Documentos, Diagnóstico, Histórico, Observações)
- Edição de respostas e diagnóstico
- Observações internas
- Geração de relatório PDF
- Controle de status do processo
