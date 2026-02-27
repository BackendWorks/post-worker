# post-worker

[![CI](https://github.com/BackendWorks/post-worker/actions/workflows/ci.yml/badge.svg)](https://github.com/BackendWorks/post-worker/actions/workflows/ci.yml)
[![Tests](https://github.com/BackendWorks/post-worker/actions/workflows/test.yml/badge.svg)](https://github.com/BackendWorks/post-worker/actions/workflows/test.yml)

NestJS async worker for the post domain. Consumes jobs from `post-service` via gRPC and Redis queue — handles search index synchronization and media/image processing.

## Responsibilities

- **Indexing module** — Sync post data to a search index when posts are created, updated, or deleted
- **Media module** — Process and store post images asynchronously

## Ports

| Protocol | Address |
|---|---|
| gRPC | `:50054` |

No HTTP server — this is a pure worker process.

## Tech Stack

NestJS 11 · TypeScript · gRPC (`nestjs-grpc`) · Redis (queue) · `@backendworks/post-db` · Jest

## Getting Started

```bash
npm install
npm run dev       # nest start --watch
```

## Environment Variables

```env
NODE_ENV=local
APP_NAME=@backendworks/post-worker

DATABASE_URL=postgresql://admin:master123@localhost:5432/postgres?schema=public

REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=post-worker:
REDIS_TTL=3600

GRPC_URL=0.0.0.0:50054
GRPC_PACKAGE=post-worker
```

## gRPC

Proto file: `src/protos/post-worker.proto`
Generated types: `src/generated/post-worker.ts` — **do not edit manually**

Worker-specific RPCs triggered asynchronously by `post-service` events.

## Project Structure

```
src/
├── app/
│   ├── app.module.ts                  # Root module
│   └── worker.grpc.controller.ts      # gRPC server endpoints
├── common/
│   ├── config/                        # app, grpc, redis configs
│   └── services/
│       └── queue.service.ts           # Redis-backed job queue consumer
├── modules/
│   ├── indexing/                      # Search index sync jobs
│   │   ├── indexing.module.ts
│   │   ├── indexing.service.ts
│   │   ├── indexing.controller.ts
│   │   └── interfaces/                # Indexing event definitions
│   └── media/                         # Image processing and storage jobs
├── protos/
└── generated/
```

## Scripts

```bash
npm run dev       # Watch mode
npm run build     # Production build
npm run lint      # ESLint --fix
npm run format    # Prettier --write
npm test          # Unit tests (100% coverage enforced)
```

## Testing

Tests live in `test/unit/`. Coverage thresholds are enforced at **100%** for branches, functions, lines, and statements.

```bash
npm test
```

## License

[MIT](LICENSE)
