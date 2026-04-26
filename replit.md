# Workspace

## Overview

Ekstraklasa Table Analyzer — a mobile app for Polish football league standings with AI-powered analysis.

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
- **Mobile**: Expo (React Native)
- **AI**: OpenAI via Replit AI Integrations

## Artifacts

- **ekstraklasa** — Expo mobile app for Ekstraklasa league table + AI analysis
- **api-server** — Express API server with AI analysis endpoint (`POST /api/ekstraklasa/analyze`)

## Features

- Full 18-team Ekstraklasa 2025/26 table with color-coded zone bars
- Team detail modal with stats, form, and AI chat
- AI Analysis tab for full-table questions powered by GPT

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
