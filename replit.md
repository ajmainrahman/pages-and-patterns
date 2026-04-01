# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Recharts
- **API framework**: Express 5 (api-server artifact, NOT used by library-portfolio)
- **Database**: PostgreSQL + Drizzle ORM (NOT used by library-portfolio)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (standalone, not used by library-portfolio)
│   └── library-portfolio/  # Personal Library Portfolio (React + Vite, fully static)
├── lib/                    # Shared libraries (NOT used by library-portfolio)
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks (NOT used by library-portfolio)
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
│   └── push-to-github.sh   # GitHub push via GITHUB_TOKEN
├── api/index.ts            # Vercel stub (unused - static site)
├── vercel.json             # Vercel static site config
├── public/                 # Vite build output (gitignored in production)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Personal Library Portfolio (`artifacts/library-portfolio`)

A **fully static** web app for cataloging personal book collections. No server or database required — all data stored in browser `localStorage`.

### Architecture

- **Data layer**: `src/lib/store.ts` — localStorage CRUD (createBook, updateBook, deleteBook, getBooks, computeStats)
- **React hooks**: `src/lib/hooks.ts` — custom React hooks (useListBooks, useGetBook, useGetStats, useCreateBook, etc.) using localStorage + browser `books-updated` event for reactivity
- **Build output**: `public/` (configured in vite.config.ts)
- **Deployment**: Vercel static site via `vercel.json`

### Features
- Store books with title, author, genres, summary, quotes, and reviews
- Star ratings (1–5), reading status (read/reading/want to read), favorites
- Dashboard with library stats (total books, avg rating, reading progress)
- Library page with search and filter by genre/status
- Book detail page with reading progress tracker, deadline tracker
- Add/edit book form with full field set
- Bengali books section with Bengali typography (Hind Siliguri font)
- Stats page with Recharts: genre breakdown, rating distribution, monthly trend, language/format donut charts
- Warm literary aesthetic (burgundy, cream, serif typography)

### Data Storage
- All data stored in `localStorage` under key `pages-and-patterns-books`
- Event `books-updated` fired on every write to trigger React re-renders
- No external services, no API calls at runtime

### Deployment (Vercel)
```json
{
  "buildCommand": "pnpm --filter @workspace/library-portfolio run build",
  "outputDirectory": "public",
  "installCommand": "pnpm install",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

To push to GitHub for Vercel deployment:
```bash
bash scripts/push-to-github.sh "commit message"
```

### Key Fix: Vite Config Compatibility
`vite.config.ts` uses `fileURLToPath(import.meta.url)` instead of `import.meta.dirname` for Node 18+ compatibility.

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
