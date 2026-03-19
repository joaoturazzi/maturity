# MaturityIQ — Grow Platform

Plataforma SaaS B2B para evolução de maturidade estratégica e aumento de valuation.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript (strict mode)
- **Banco de dados:** Neon (PostgreSQL serverless)
- **ORM:** Drizzle ORM (drizzle-orm + drizzle-kit)
- **Auth:** NextAuth.js v5 (Credentials provider, JWT, Drizzle adapter)
- **Estilização:** CSS Modules + variáveis CSS
- **Charts:** Recharts
- **State:** Zustand (global) + useState (local)
- **Forms:** React Hook Form + Zod
- **AI:** OpenAI API (Fase 4)
- **Deploy:** Netlify (@netlify/plugin-nextjs)

## Setup

### 1. Clone e instale dependências

```bash
git clone <repo-url>
cd maturityiq
npm install
```

### 2. Configure variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```bash
cp .env.local.example .env.local
```

Variáveis necessárias:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do Neon (PostgreSQL) |
| `NEXTAUTH_SECRET` | Segredo JWT — gere com `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL da aplicação (`http://localhost:3000` em dev) |
| `OPENAI_API_KEY` | Chave da OpenAI (Fase 4 — deixar vazio por ora) |

### 3. Criar tabelas no Neon

```bash
npm run db:push
```

Isso lê o schema Drizzle (`lib/db/schema.ts`) e cria as tabelas no Neon.

### 4. Seed do banco

Popule `data/seed/questions.json` com os ~150 indicadores do Excel, depois:

```bash
npm run db:seed
```

### 5. Rode o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### 6. Visualizar banco (opcional)

```bash
npm run db:studio
```

Abre Drizzle Studio em http://local.drizzle.studio

## Estrutura de pastas

```
app/              → Pages e API routes (App Router)
components/       → Componentes React organizados por domínio
lib/db/           → Drizzle schema, conexão Neon, queries
lib/scoring/      → Cálculos de IME, gaps, prioridade
lib/agents/       → Prompts e contexto dos agentes IA (Fase 4)
lib/utils/        → Formatadores e validadores
hooks/            → Custom hooks
store/            → Zustand stores
types/            → TypeScript types
data/seed/        → JSON de seed (dimensões, indicadores, perguntas)
styles/           → CSS global, tokens, brand
scripts/          → Scripts utilitários (seed)
```

## Dimensões do Diagnóstico

| Dimensão | Cor | Indicadores |
|---|---|---|
| Estratégia | `#1a5276` | 30 |
| Produto | `#8e44ad` | 30 |
| Mercado | `#1e8449` | 30 |
| Finanças | `#d68910` | 30 |
| Branding | `#c0392b` | 30 |

## Scoring

- **IME Score** = média simples dos scores ponderados das 5 dimensões
- **Maturity Level:** Initial (1.0–1.9) | Developing (2.0–2.9) | Defined (3.0–3.4) | Managed (3.5–4.4) | Optimized (4.5–5.0)
- **Gap** = desired_score − weighted_score
- **Priority:** Critical (≥3.0) | High (2.0–2.9) | Medium (1.0–1.9) | Low (<1.0)

## Papéis

- **User:** empresa que faz diagnóstico e executa plano
- **SuperUser:** consultor Paulo Beck, vê múltiplas empresas
- **Admin:** acesso global + configuração

## Deploy no Netlify

1. Conectar repositório no Netlify
2. Build settings detectados automaticamente via `netlify.toml`
3. Configurar variáveis de ambiente no Netlify:
   - `DATABASE_URL` — string de conexão Neon (produção)
   - `NEXTAUTH_SECRET` — mesmo valor do .env.local
   - `NEXTAUTH_URL` — `https://seu-dominio.netlify.app`
   - `OPENAI_API_KEY` — vazio por ora (Fase 4)

## Fases de implementação

- ✅ Fase 1: Scaffolding + Diagnóstico + Dashboard
- ⬜ Fase 2: Planos de Ação + Check-ins
- ⬜ Fase 3: Relatórios + Aceleração + Admin
- ⬜ Fase 4: Agentes de IA
- ⬜ Fase 5+: Integrações externas
