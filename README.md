# <img src="https://img.shields.io/badge/ProjectHub-1F3864?style=for-the-badge&logo=hexo&logoColor=3b82f6" alt="ProjectHub" />

> Plataforma de gerenciamento de projetos em nuvem — desenvolvida como Atividade Final da disciplina **Desenvolvimento de Software em Nuvem** (ADS/IA EAD — UNIFOR).

[![CI/CD](https://github.com/carlosdanielalves/projecthub/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/carlosdanielalves/projecthub/actions)
[![Coverage](https://img.shields.io/badge/coverage-%E2%89%A570%25-22c55e)](https://github.com/carlosdanielalves/projecthub)
[![Python](https://img.shields.io/badge/Python-3.11-3b82f6?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-24-2496ED?logo=docker&logoColor=white)](https://docker.com)

---

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Arquitetura](#arquitetura)
- [Stack de Tecnologias](#stack-de-tecnologias)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Setup Local](#setup-local)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Rodando com Docker](#rodando-com-docker)
- [Testes](#testes)
- [Deploy em Nuvem](#deploy-em-nuvem)
- [Documentação da API](#documentação-da-api)
- [Estrutura do Repositório](#estrutura-do-repositório)
- [CI/CD Pipeline](#cicd-pipeline)
- [Equipe](#equipe)

---

## Sobre o Projeto

O **ProjectHub** é uma aplicação web SaaS para gerenciamento de projetos e tarefas em equipe. Permite criar projetos, adicionar membros, organizar tarefas em um kanban board, acompanhar métricas no dashboard e visualizar commits do GitHub vinculados ao projeto.

**Links de produção:**

| Serviço | URL |
|---------|-----|
| 🌐 Front-end (Vercel) | `https://projecthub.vercel.app` |
| ⚙️ API Back-end (Render) | `https://projecthub-api.onrender.com` |
| 📖 Swagger Docs | `https://projecthub-api.onrender.com/docs` |

---

## Arquitetura

```
┌─────────────────────────────────────────────────┐
│         USUÁRIO  (Navegador / Browser)           │
└───────────────────────┬─────────────────────────┘
                        │  HTTPS
                        ▼
┌─────────────────────────────────────────────────┐
│   FRONT-END  —  React 18 + Vite + Tailwind CSS  │
│           Deploy: Vercel  (CDN global)           │
└───────────────────────┬─────────────────────────┘
                        │  REST / JSON (HTTPS)
                        ▼
┌─────────────────────────────────────────────────┐
│   BACK-END  —  Python 3.11 + FastAPI (Docker)   │
│         Deploy: Render.com (container)           │
└────────┬───────────────┬────────────────┬────────┘
         │               │                │
         ▼               ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌────────────────┐
│ PostgreSQL   │ │ Redis Cache  │ │  GitHub API    │
│  (Supabase)  │ │  (Upstash)   │ │  (externa)     │
└──────────────┘ └──────────────┘ └────────────────┘
```

---

## Stack de Tecnologias

### Back-end
| Tecnologia | Versão | Função |
|-----------|--------|--------|
| Python | 3.11 | Linguagem principal |
| FastAPI | 0.110 | Framework da API REST |
| SQLAlchemy | 2.0 | ORM e migrations |
| Pydantic | 2.x | Validação de dados e schemas |
| python-jose | 3.x | Geração e validação de JWT |
| passlib + bcrypt | 1.7 | Hash seguro de senhas |
| httpx | 0.27 | Cliente HTTP para GitHub API |
| Redis (Upstash) | — | Cache de queries e sessões |
| Docker | 24 | Containerização do back-end |

### Front-end
| Tecnologia | Versão | Função |
|-----------|--------|--------|
| React | 18 | Biblioteca de UI |
| Vite | 5 | Build tool e dev server |
| Tailwind CSS | 3 | Estilização utilitária |
| TanStack Query | 5 | Cache e estado do servidor |
| React Router | 6 | Navegação SPA |
| Axios | 1.x | Requisições HTTP |
| date-fns | 3 | Formatação de datas |
| lucide-react | — | Ícones |

### Infraestrutura
| Serviço | Uso |
|---------|-----|
| Supabase | PostgreSQL gerenciado em nuvem |
| Upstash | Redis serverless |
| Render.com | Deploy do container Docker |
| Vercel | Deploy do front-end + CDN |
| GitHub Actions | Pipeline CI/CD |

---

## Funcionalidades

- **Autenticação completa** — Registro, login, refresh token JWT, proteção de rotas
- **Perfis de acesso** — Admin e Usuário com permissões distintas
- **CRUD de Projetos** — Criação, listagem, edição, remoção, controle de status
- **Gerenciamento de Membros** — Adicionar/remover membros com papel (dono, membro, visitante)
- **Kanban Board** — Tarefas organizadas em "A Fazer / Em Progresso / Concluído"
- **CRUD de Tarefas** — Com prioridade (baixa/média/alta), responsável e data limite
- **Dashboard** — Métricas de projetos e tarefas, taxa de conclusão, feed de atividade
- **Histórico de Atividades** — Log de todas as ações por projeto e por usuário
- **Integração GitHub** — Exibe commits do repositório vinculado ao projeto (com cache Redis)
- **API Documentada** — Swagger/OpenAPI disponível em `/docs`
- **CI/CD Completo** — Build, lint, testes e deploy automático via GitHub Actions

---

## Pré-requisitos

- [Python 3.11+](https://python.org)
- [Node.js 20+](https://nodejs.org)
- [Docker](https://docker.com) (opcional para rodar localmente via container)
- Conta no [Supabase](https://supabase.com) (banco de dados)
- Conta no [Upstash](https://upstash.com) (Redis — opcional)

---

## Setup Local

### 1. Clone o repositório

```bash
git clone https://github.com/carlosdanielalves/projecthub.git
cd projecthub
```

### 2. Configure o banco de dados no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Copie a **Connection String** em *Settings → Database → Connection string → URI*
3. O ProjectHub cria as tabelas automaticamente no primeiro start (via SQLAlchemy)

### 3. Back-end

```bash
cd backend

# Crie o ambiente virtual
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows

# Instale as dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais (veja seção abaixo)

# Rode a API
uvicorn app.main:app --reload --port 8000
```

A API estará disponível em `http://localhost:8000`
Documentação Swagger em `http://localhost:8000/docs`

### 4. Front-end

```bash
cd frontend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite VITE_API_URL=http://localhost:8000

# Rode o dev server
npm run dev
```

O front-end estará disponível em `http://localhost:5173`

---

## Variáveis de Ambiente

### Back-end (`backend/.env`)

```env
# App
APP_NAME=ProjectHub API
DEBUG=false

# Database — Supabase PostgreSQL
DATABASE_URL=postgresql://postgres:SENHA@db.XXXX.supabase.co:5432/postgres

# JWT — gere com: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=sua-chave-secreta-de-256-bits
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis — Upstash (deixe vazio para desativar o cache)
REDIS_URL=rediss://default:TOKEN@host.upstash.io:6379

# GitHub API (opcional — aumenta o rate limit de 60 para 5000 req/h)
GITHUB_TOKEN=ghp_SEU_TOKEN

# CORS — origens permitidas (separadas por vírgula)
ALLOWED_ORIGINS=https://seu-app.vercel.app,http://localhost:5173
```

### Front-end (`frontend/.env.local`)

```env
# URL da API back-end (sem barra final)
VITE_API_URL=http://localhost:8000
```

> ⚠️ **Nunca versione arquivos `.env` com credenciais reais.** O `.gitignore` já os exclui.

---

## Rodando com Docker

### Apenas o back-end

```bash
cd backend

# Build da imagem
docker build -t projecthub-api .

# Rodando o container
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e SECRET_KEY="sua-chave" \
  -e ALLOWED_ORIGINS="http://localhost:5173" \
  projecthub-api
```

### Docker Compose (back-end + banco local)

```yaml
# docker-compose.yml (desenvolvimento local)
version: "3.9"
services:
  api:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/projecthub
      SECRET_KEY: dev-secret-key-troque-em-producao
      ALLOWED_ORIGINS: http://localhost:5173
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: projecthub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker compose up -d
```

---

## Testes

### Back-end (pytest)

```bash
cd backend
source .venv/bin/activate

# Rodar todos os testes com relatório de cobertura
pytest

# Apenas um arquivo
pytest tests/test_auth.py -v

# Com cobertura HTML
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

Os testes usam um banco **SQLite em memória** — nenhuma conexão com Supabase é necessária.

**Cobertura mínima exigida:** 70%

### Front-end (Vitest)

```bash
cd frontend

# Rodar testes
npm run test

# Com interface visual
npm run test:ui

# Uma única execução (CI)
npm run test -- --run
```

---

## Deploy em Nuvem

### Back-end → Render.com

1. Acesse [render.com](https://render.com) e crie um **New Web Service**
2. Conecte o repositório GitHub
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** *(vazio — usa Dockerfile)*
   - **Start Command:** *(vazio — usa CMD do Dockerfile)*
   - **Environment:** adicione todas as variáveis do `.env`
4. Copie a **Deploy Hook URL** (Settings → Deploy Hook) e salve como `RENDER_DEPLOY_HOOK_URL` nos Secrets do GitHub

### Front-end → Vercel

```bash
# Via CLI
cd frontend
npx vercel --prod
```

Ou conecte o repositório diretamente em [vercel.com](https://vercel.com):
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- Adicione `VITE_API_URL` apontando para o Render

### GitHub Secrets necessários para o CI/CD

| Secret | Descrição |
|--------|-----------|
| `RENDER_DEPLOY_HOOK_URL` | URL do webhook de deploy do Render |
| `VERCEL_TOKEN` | Token de acesso da conta Vercel |
| `VERCEL_ORG_ID` | ID da organização Vercel |
| `VERCEL_PROJECT_ID` | ID do projeto Vercel |

---

## Documentação da API

A documentação interativa é gerada automaticamente pelo FastAPI.

| Interface | URL |
|-----------|-----|
| Swagger UI | `/docs` |
| ReDoc | `/redoc` |
| Health Check | `/health` |

### Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/register` | Cadastrar usuário |
| `POST` | `/auth/login` | Login → retorna JWT |
| `POST` | `/auth/refresh` | Renovar access token |
| `GET` | `/auth/me` | Dados do usuário logado |
| `GET` | `/projects/` | Listar projetos |
| `POST` | `/projects/` | Criar projeto |
| `GET` | `/projects/{id}` | Detalhes do projeto |
| `PUT` | `/projects/{id}` | Atualizar projeto |
| `DELETE` | `/projects/{id}` | Remover projeto |
| `POST` | `/projects/{id}/members` | Adicionar membro |
| `GET` | `/projects/{id}/github` | Commits do GitHub |
| `GET` | `/projects/{id}/tasks` | Listar tarefas |
| `POST` | `/projects/{id}/tasks` | Criar tarefa |
| `PUT` | `/tasks/{id}` | Atualizar tarefa |
| `DELETE` | `/tasks/{id}` | Remover tarefa |
| `GET` | `/dashboard` | Métricas gerais |
| `GET` | `/activity` | Histórico do usuário |

**Autenticação:** todas as rotas (exceto `/auth/register` e `/auth/login`) exigem o header:
```
Authorization: Bearer <access_token>
```

---

## Estrutura do Repositório

```
projecthub/
├── backend/                        # API FastAPI
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py           # Settings (pydantic-settings)
│   │   │   ├── database.py         # Engine SQLAlchemy + sessão
│   │   │   ├── security.py         # JWT + bcrypt + dependências de auth
│   │   │   ├── cache.py            # Redis helper (opcional)
│   │   │   └── logging.py          # Logs estruturados JSON
│   │   ├── models/                 # Modelos SQLAlchemy
│   │   │   ├── user.py
│   │   │   ├── project.py          # Project + ProjectMember
│   │   │   ├── task.py
│   │   │   └── activity_log.py
│   │   ├── schemas/                # Schemas Pydantic v2
│   │   │   ├── user.py
│   │   │   ├── auth.py
│   │   │   ├── project.py
│   │   │   ├── task.py
│   │   │   └── activity_log.py
│   │   ├── routers/                # Rotas da API
│   │   │   ├── auth.py
│   │   │   ├── projects.py
│   │   │   ├── tasks.py
│   │   │   └── dashboard.py
│   │   ├── services/
│   │   │   ├── activity.py         # Registro de logs
│   │   │   └── github.py           # Integração GitHub API
│   │   └── main.py                 # Entry point FastAPI
│   ├── tests/
│   │   ├── conftest.py             # Fixtures + banco SQLite de teste
│   │   ├── test_auth.py            # 11 testes de autenticação
│   │   ├── test_projects.py        # 8 testes de projetos
│   │   └── test_tasks.py           # 8 testes de tarefas + dashboard
│   ├── Dockerfile                  # Multi-stage build
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── ruff.toml
│   └── .env.example
│
├── frontend/                       # SPA React
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js           # Axios + interceptors (auto-refresh JWT)
│   │   │   ├── auth.js
│   │   │   ├── projects.js
│   │   │   └── tasks.js            # Tasks + Dashboard API
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Estado global de autenticação
│   │   ├── components/
│   │   │   ├── ui/index.jsx        # Button, Input, Badge, Modal, Alert...
│   │   │   └── layout/
│   │   │       ├── Sidebar.jsx
│   │   │       └── AppLayout.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx       # Métricas + feed de atividade
│   │   │   ├── Projects.jsx        # Grid + filtros + modal de criação
│   │   │   └── ProjectDetail.jsx   # Kanban + Members + GitHub + Activity
│   │   ├── tests/
│   │   │   ├── setup.js
│   │   │   ├── components.test.jsx # 14 testes de componentes UI
│   │   │   └── login.test.jsx      # 5 testes de fluxo Login
│   │   ├── App.jsx                 # Roteamento principal
│   │   ├── main.jsx
│   │   └── index.css               # Tokens de design + Tailwind
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── .env.example
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml               # Pipeline completo
│
├── .gitignore
└── README.md
```

---

## CI/CD Pipeline

O pipeline é ativado automaticamente pelo GitHub Actions:

```
Push em qualquer branch
        │
        ▼
┌───────────────────────────────────────┐
│  Job: backend                         │
│  ├── Checkout                         │
│  ├── Setup Python 3.11                │
│  ├── pip install                      │
│  ├── ruff check (lint)                │
│  └── pytest --cov (≥70% cobertura)    │
└──────────────────┬────────────────────┘
                   │ (sucesso)
                   ▼
┌───────────────────────────────────────┐
│  Job: docker                          │
│  └── docker build (valida Dockerfile) │
└──────────────────┬────────────────────┘
                   │ (apenas push em main)
                   ▼
┌───────────────────────────────────────┐
│  Job: deploy-backend                  │
│  └── curl Render Deploy Hook          │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│  Job: deploy-frontend                 │
│  ├── npm ci                           │
│  ├── vitest --run (testes)            │
│  └── vercel --prod                    │
└───────────────────────────────────────┘
```

**Triggers:**
- `push` em `main` → pipeline completo (lint + testes + deploy)
- `push` em `feature/**` → apenas lint + testes
- `pull_request` para `main` → lint + testes + docker build

---

## Equipe

| Nome | Matrícula | Papéis |
|------|-----------|--------|
| Carlos Daniel Albino Alves | 2523582 | Arquiteto de Software, Dev Back-end, Dev Front-end, DevOps, QA, Documentação |

---

## Bônus implementados ✨

- **Cache Redis (Upstash):** dashboard, listagem de projetos e commits do GitHub com TTL configurável
- **Monitoramento:** logs estruturados em JSON com níveis INFO/WARNING/ERROR e timestamps ISO 8601
- **Integração com API externa:** GitHub REST API v3 para commits com cache de 5 minutos
- **Feature Flag:** funcionalidades controladas via variáveis de ambiente (ex: `REDIS_URL` vazio desativa o cache sem quebrar a aplicação)

---

<div align="center">
  <sub>Desenvolvido por Carlos Daniel Albino Alves — UNIFOR 2025</sub>
</div>
