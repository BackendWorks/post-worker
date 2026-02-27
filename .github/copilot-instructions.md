# Copilot Instructions – Post Worker

## Overview

Background worker for the post domain. Has **no HTTP server** and **no Swagger**. Listens on gRPC port `:50054` for async jobs triggered by `post-service` (e.g. search index sync, image processing, media storage).

Uses `@backendworks/post-db` at the **same version range** as `post-service` — never pin them to different versions.

## Developer Workflows

Run all commands from the `post-worker/` directory:

```bash
npm run dev              # proto:generate → nest start --watch
npm run test             # jest --runInBand, 100% coverage enforced
npm run proto:generate   # regenerates src/generated/post-worker.ts from src/protos/
```

**Database migrations are NOT run from here.** Schema is owned by `packages/post-db/`.

## gRPC Server

Defined in `src/protos/post-worker.proto`, types auto-generated into `src/generated/post-worker.ts` — never edit generated files.

Workers expose RPCs for async jobs, for example:

```protobuf
service PostWorkerService {
  rpc IndexPost(IndexPostRequest) returns (IndexPostResponse);
  rpc ProcessMedia(ProcessMediaRequest) returns (ProcessMediaResponse);
}
```

Controller: `src/app/worker.grpc.controller.ts` using `@GrpcController` / `@GrpcMethod` from `nestjs-grpc`.

## Key Differences from post-service

| Feature     | post-service            | post-worker            |
| ----------- | ----------------------- | ---------------------- |
| HTTP server | ✅ port 9002            | ❌ none                |
| Swagger     | ✅                      | ❌ no doc.config       |
| Auth guard  | ✅ gRPC-based JWT guard | ❌ none (internal RPC) |
| i18n        | ✅                      | ❌ (no HTTP responses) |
| gRPC        | ✅ port 50052           | ✅ port 50054          |
| Redis queue | ❌                      | ✅ queue.service.ts    |

## CommonModule (worker variant)

`CommonModule` in this service registers only:

- `ConfigModule` with Joi validation for `app`, `grpc`, `redis` namespaces (no `doc.*`)
- `CacheModule` (Redis via `@keyv/redis`)
- `@backendworks/post-db` db manager via `createPostDbManager()`

No guards, no interceptors, no i18n — this is a headless worker.

## Database Access

```typescript
// Inject IPostRepository via IPostDbManager — never use PrismaClient directly
import { createPostDbManager, IPostDbManager } from "@backendworks/post-db";

const dbManager: IPostDbManager = createPostDbManager(connectionString);
const postRepo = dbManager.postRepository;
await postRepo.findById(postId);
```

## Folder Structure

```
src/
  app/
    app.module.ts               # Wires CommonModule, indexing module, media module, GrpcModule
    worker.grpc.controller.ts   # gRPC server on :50054
  common/
    common.module.ts            # Config (app/grpc/redis), cache, db — no HTTP/Passport/Swagger
    config/
      app.config.ts             # → 'app.*'
      grpc.config.ts            # → 'grpc.*'
      redis.config.ts           # → 'redis.*'
    services/
      queue.service.ts          # Redis-backed job queue consumer
    interfaces/                 # Shared worker interfaces
    constants/                  # Metadata key strings
  modules/
    indexing/                   # Syncs posts to search index on create/update/delete events
    media/                      # Processes uploaded images; handles storage (S3/CDN)
  protos/
    post-worker.proto           # Worker RPC definitions
  generated/
    post-worker.ts              # AUTO-GENERATED — do not edit
test/
  jest.json
  unit/
    queue.service.spec.ts
    # + one spec per module service
```

## Testing Conventions

- Same 100% coverage rule as all other services
- No `@nestjs/testing` auto-mocking — all dependencies are plain `jest.fn()` objects
- No HTTP to test; focus on gRPC handler logic and queue consumer logic
- Mock `IPostRepository` methods directly: `const mockPostRepo = { findById: jest.fn(), ... }`
