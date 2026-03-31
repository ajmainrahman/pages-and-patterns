# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Recharts

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── library-portfolio/  # Personal Library Portfolio (React + Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Personal Library Portfolio

A full-stack web app for cataloging personal book collections.

### Features
- Store books with title, author, genres, summary, quotes, and reviews
- Star ratings (1–5), reading status (read/reading/want to read), favorites
- Dashboard with library stats (total books, avg rating, reading progress)
- Library page with search and filter by genre/status
- Book detail page with all information, quotes, and review
- Add/edit book form
- Stats page with genre breakdown and top authors charts
- Warm literary aesthetic (burgundy, cream, serif typography)

### Data Model (books table)
- id, title, author, genres[], summary, quotes[], review, rating (1-5)
- status: "read" | "reading" | "want_to_read"
- coverUrl, publishedYear, pageCount, isFavorite
- createdAt, updatedAt

### API Endpoints
- GET/POST /api/books — list (with search/genre/status filters) and create
- GET/PATCH/DELETE /api/books/:id — get, update, delete
- GET /api/books/genres — list all unique genres
- GET /api/books/recent — recently added books
- GET /api/books/favorites — favorited books
- GET /api/stats — full library statistics

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

### `artifacts/library-portfolio` (`@workspace/library-portfolio`)

React + Vite frontend. Serves the Personal Library Portfolio at `/`. Uses generated React Query hooks from `@workspace/api-client-react`.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- Schema: `lib/db/src/schema/books.ts` — books table
- Push dev schema: `pnpm --filter @workspace/db run push`

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config.
Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.
