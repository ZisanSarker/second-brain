# AI Second Brain

A production-ready knowledge management platform with AI-powered search, chat, collaboration, and agent automation. Turn your documents, notes, and imports into an intelligent, queryable knowledge base.

## Architecture

```
┌──────────┐    ┌──────────────────┐    ┌──────────────┐
│  Next.js  │───▶│  NestJS API      │───▶│  FastAPI AI  │
│  Frontend │    │  (Monolith)      │    │  (Worker)    │
│  :3000    │    │  :3001            │    │  :8000        │
└──────────┘    └──┬──┬──┬──┬──┬───┘    └──────┬───────┘
                   │  │  │  │  │               │
          ┌────────┘  │  │  │  └──────────┐    │
          ▼           ▼  ▼  ▼             ▼    ▼
      PostgreSQL    Redis MinIO       Qdrant  OpenRouter
      (Primary DB)  (MQ) (Files)    (Vectors) (LLM)
```

- **NestJS API** — Modular monolith. Handles auth, RBAC, documents, search orchestration, chat, collaboration, agents, workflows
- **Next.js Frontend** — Server-rendered React app with Tailwind CSS v4
- **FastAPI AI Worker** — Text extraction, chunking, embeddings, LLM calls, OCR
- **PostgreSQL** — Primary database via Prisma 7 ORM
- **Redis** — BullMQ job queues + caching
- **MinIO** — S3-compatible file storage (documents, uploads, thumbnails)
- **Qdrant** — Vector database for semantic search
- **OpenRouter** — Unified API for GPT, Claude, Gemini, Llama, and 200+ models

## Tech Stack

| Layer     | Technology                                                       |
| --------- | ---------------------------------------------------------------- |
| Backend   | NestJS 11, GraphQL (Apollo), Prisma 7, BullMQ 5, JWT + Passport  |
| Frontend  | Next.js 15, React 19, TanStack Query 5, Zustand, Tailwind CSS v4 |
| AI Worker | FastAPI, sentence-transformers, Qdrant client, OpenAI SDK        |
| Infra     | Docker Compose, PostgreSQL 16, Redis 8, MinIO, Qdrant v1.18      |
| Monorepo  | pnpm workspaces, Turbo 2, Husky, commitlint, lint-staged         |

## Prerequisites

- Node.js 20+ (24 recommended)
- pnpm 9.15+
- Docker and Docker Compose (for infrastructure services)
- OpenRouter API key (or compatible OpenAI API key)

## Quick Start (Local Development)

```bash
# 1. Clone and install
git clone <repo-url>
cd second-brain
pnpm install

# 2. Copy environment files
cp .env.example .env
# Edit .env and set OPENROUTER_API_KEY=your-key

# 3. Start infrastructure services
docker compose up -d postgres redis qdrant minio

# 4. Run database migrations
pnpm --filter=api prisma:migrate

# 5. Start all services (in separate terminals or use tmux)
pnpm dev
```

The dev command starts all three apps concurrently via `scripts/dev.mjs`:

- API: http://localhost:3001 (Swagger: http://localhost:3001/api/docs)
- Web: http://localhost:3000
- AI: http://localhost:8000

## Docker Setup (Full Stack)

```bash
# Build and start everything
docker compose up --build -d

# Single command to start the whole stack:
# postgres, redis, qdrant, minio, ai-service, api, web, nginx
```

- The API comes up at `http://localhost:3001`
- The Web app at `http://localhost:3000`
- Nginx reverse proxy at `http://localhost:80` (routes `/api/*` to API, `/` to Web)
- Health checks: `http://localhost:3001/api/v1/health/liveness`

## Environment Variables

All variables are documented in [`.env.example`](.env.example). Key variables:

| Variable             | Required   | Description                                                |
| -------------------- | ---------- | ---------------------------------------------------------- |
| `DATABASE_URL`       | Yes        | PostgreSQL connection string                               |
| `JWT_SECRET`         | Yes        | **Change this in production** — use `openssl rand -hex 64` |
| `REDIS_HOST`         | Yes        | Redis host for BullMQ queues                               |
| `MINIO_ENDPOINT`     | Yes        | MinIO S3 endpoint                                          |
| `OPENROUTER_API_KEY` | Production | API key for LLM access                                     |

## Deployment (VPS)

### Prerequisites

- Docker and Docker Compose installed on your VPS
- A domain with DNS pointing to your server
- OpenRouter API key

### Steps

```bash
# 1. Clone repository on VPS
git clone <repo-url> /opt/second-brain
cd /opt/second-brain

# 2. Configure environment
cp .env.example .env
# Edit .env:
#   - Set strong JWT_SECRET (openssl rand -hex 64)
#   - Set OPENROUTER_API_KEY
#   - Set CORS_ORIGINS to your domain
#   - Change POSTGRES_PASSWORD and MINIO_ROOT_PASSWORD

# 3. Set up SSL certificates
mkdir -p docker/ssl
# Option A: Use Let's Encrypt certbot
# certbot certonly --standalone -d yourdomain.com
# cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/ssl/cert.pem
# cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/ssl/key.pem

# Option B: Self-signed (for testing only)
# openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#   -keyout docker/ssl/key.pem -out docker/ssl/cert.pem

# 4. Start everything
docker compose up --build -d

# 5. Verify
curl http://localhost:3001/api/v1/health/liveness
curl https://yourdomain.com/api/v1/health/readiness
```

### Nginx Configuration

The [`docker/nginx.conf`](docker/nginx.conf) handles:

- SSL/TLS termination
- Reverse proxy to API (/api/_) and Web (/_)
- WebSocket upgrade for real-time chat
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options)
- Request body size limit (50MB)
- Gzip compression

### Security Checklist

Before going live:

- [ ] `JWT_SECRET` changed from default (use `openssl rand -hex 64`)
- [ ] `POSTGRES_PASSWORD` and `MINIO_ROOT_PASSWORD` changed from defaults
- [ ] `OPENROUTER_API_KEY` is set
- [ ] SSL certificates mounted in `docker/ssl/`
- [ ] `CORS_ORIGINS` set to your domain
- [ ] Docker containers restart automatically (`restart: always`)
- [ ] Swagger/GraphQL playground disabled (`NODE_ENV=production`)
- [ ] Firewall configured (allow 80, 443 from internet; block 3000, 3001, 5432, etc.)

## Backup

### PostgreSQL

```bash
docker exec secondbrain_postgres pg_dump -U postgres secondbrain > backup_$(date +%Y%m%d).sql
```

### MinIO

```bash
docker exec secondbrain_minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec secondbrain_minio mc mirror local/documents ./backup/minio/
```

### Qdrant

```bash
curl -X POST 'http://localhost:6333/collections/chunks/snapshots'
# Download snapshot from /qdrant/snapshots/ container path
```

### Restore

```bash
# PostgreSQL
cat backup_20250101.sql | docker exec -i secondbrain_postgres psql -U postgres secondbrain

# MinIO
docker exec secondbrain_minio mc mirror ./backup/minio/ local/documents

# Qdrant
# Upload snapshot and use recovery API
```

## Common Commands

```bash
# Development
pnpm dev              # Run all apps concurrently
pnpm --filter=api dev  # Run only the API
pnpm --filter=web dev  # Run only the frontend

# Database
pnpm --filter=api prisma:migrate   # Apply migrations
pnpm --filter=api prisma:generate  # Regenerate Prisma client
pnpm --filter=api prisma:studio    # Open Prisma Studio

# Testing
pnpm --filter=api test     # Unit tests (333+ tests)
pnpm --filter=api test:e2e # E2E tests

# Building
pnpm build              # Build all apps
pnpm --filter=api build  # Build only the API
pnpm --filter=web build  # Build only the frontend

# Linting
pnpm lint               # ESLint across all apps
pnpm format             # Prettier formatting

# Docker
docker compose up -d          # Start infrastructure services
docker compose up --build -d  # Full stack build and start
docker compose logs -f api    # Follow API logs
docker compose down           # Stop all services

# Production
NODE_ENV=production pnpm --filter=api start:prod
```

## Folder Structure

```
├── apps/
│   ├── api/          # NestJS backend (Auth, Documents, Chat, Search, AI, Agents, ...)
│   ├── web/          # Next.js frontend (React, Tailwind, TanStack Query)
│   └── ai/           # FastAPI AI worker (Chunking, Embeddings, LLM, OCR)
├── packages/
│   ├── config/       # Shared TypeScript config (tsconfig.base.json)
│   ├── shared/       # Shared utility library
│   ├── types/        # Shared TypeScript types/interfaces
│   └── ui/           # Shared UI component library
├── docker/
│   ├── nginx.conf    # Nginx reverse proxy configuration
│   └── ssl/          # SSL certificates (mount for production)
├── scripts/
│   └── dev.mjs       # Development multiplexer (runs all 3 apps)
├── .env.example      # Environment variable template
└── docker-compose.yml # Full stack orchestration
```

## API Documentation

When running in development mode, Swagger UI is available at:

```
http://localhost:3001/api/docs
```

Key API groups:

- `POST /api/v1/auth/*` — Register, login, refresh tokens
- `GET/POST /api/v1/workspaces/*` — Workspace and member management
- `GET/POST /api/v1/documents/*` — Document CRUD, upload, import
- `GET /api/v1/search/*` — Semantic and keyword search
- `POST /api/v1/chat/*` — AI chat with RAG context
- `GET/POST /api/v1/notifications/*` — In-app notifications
- `GET /api/v1/health/*` — Liveness and readiness probes

GraphQL endpoint: `http://localhost:3001/graphql` (playground in dev only)

## Troubleshooting

| Problem                  | Solution                                                            |
| ------------------------ | ------------------------------------------------------------------- |
| Docker permission denied | Add user to docker group: `sudo usermod -aG docker $USER`           |
| Port already in use      | Check `lsof -i :3001` / `lsof -i :5432` and kill the process        |
| Prisma migration fails   | Ensure postgres is running: `docker compose up -d postgres`         |
| OpenRouter returns 401   | Set `OPENROUTER_API_KEY` in `.env`                                  |
| AI service won't start   | Check `docker compose logs ai-service` for Python dependency errors |
| Upload fails with 413    | Increase `client_max_body_size` in `docker/nginx.conf`              |
| Redis connection refused | Ensure redis is healthy: `docker compose ps redis`                  |

## License

MIT
