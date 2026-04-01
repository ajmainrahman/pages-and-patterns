# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion + Recharts
- **API framework**: Express 5 (api-server artifact, port 8080)
- **Database**: PostgreSQL + Drizzle ORM
- **Data fetching**: React Query (TanStack Query) via `@workspace/api-client-react` generated hooks

## Architecture

**Dynamic full-stack**: The `library-portfolio` React app calls the `api-server` Express API which reads/writes PostgreSQL via Drizzle ORM. All data is persisted to the database.

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (port 8080, PostgreSQL + Drizzle)
│   └── library-portfolio/  # Personal Library Portfolio (React + Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks (used by library-portfolio)
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
│   └── push-to-github.sh   # GitHub push via GITHUB_TOKEN
├── api/
│   └── index.ts            # Vercel serverless entry — re-exports Express app
└── vercel.json             # Vercel build config: frontend build + API rewrite + SPA fallback
```

## Key Files

- `artifacts/api-server/src/app.ts` — Express app with `/api` routes
- `artifacts/api-server/src/routes/` — Route handlers (books, stats, genres)
- `artifacts/library-portfolio/src/pages/` — All 7 pages using React Query hooks
- `artifacts/library-portfolio/src/components/book-card.tsx` — Book card using `Book` type from api-client-react
- `lib/api-client-react/src/generated/api.ts` — Auto-generated hooks: `useListBooks`, `useGetBook`, `useCreateBook`, `useUpdateBook`, `useDeleteBook`, `useGetStats`, `useListBengaliBooks`, `useListFavoriteBooks`, `useListRecentBooks`, `useListGenres`

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Stats, currently reading, favorites, recent books |
| Library | `/library` | Browse + filter all books |
| Bengali Books | `/bangla` | বাংলা বই section |
| Stats | `/stats` | Charts: ratings, genres, monthly, authors |
| Book Detail | `/books/:id` | Full detail + progress tracker + deadline tracker |
| Add Book | `/add` | Add new book form |
| Edit Book | `/books/:id/edit` | Edit existing book form |

## Features

- Reading progress tracker (page progress bar, inline page update)
- Deadline tracker with daily pages-per-day calculation
- Bengali books section with বাংলা UI
- Favorites, ratings, review, quotes
- Genre filtering, search, status filtering
- Stats charts (Recharts): rating distribution, genre breakdown, monthly trends, donut charts

## Deployment (Vercel)

- `vercel.json` builds the Vite frontend to `public/`
- `api/index.ts` exports the Express app as a Vercel serverless function
- `/api/*` routes rewrite to the serverless function
- All other routes fall through to `index.html` (SPA routing)

## Important Notes

- The `vite.config.ts` uses `fileURLToPath(import.meta.url)` (not `import.meta.dirname`) for Node 18+ compatibility
- API server binds to `PORT` env var (defaults to 8080 in dev)
- Dead localStorage files (`store.ts`, `hooks.ts`) have been removed
- Bengali font: "Hind Siliguri" loaded via Google Fonts, applied with `font-bengali` CSS class
