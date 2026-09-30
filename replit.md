# MiXd Apparel Storefront

A hand-drawn small-batch streetwear storefront with catalog browsing, product details, a persistent bag, and customer contact flows.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mixd-apparel/src/App.tsx` — storefront routes, product catalog, garment illustrations, bag state, and forms
- `artifacts/mixd-apparel/src/index.css` — suede/gold-leaf visual system and responsive layout
- `artifacts/mixd-apparel/public/logo.jpg` — MiXd brand mark used in the shell and story pages
- `artifacts/mixd-apparel/.replit-artifact/artifact.toml` — web artifact routing and managed workflow configuration

## Architecture decisions

- The storefront is frontend-only for now; catalog data is intentionally local so the visual site can be previewed without a service dependency.
- Bag and newsletter state use localStorage, matching the original static storefront behavior.
- Garment art remains inline SVG so colors, views, and product variants stay lightweight and editable.
- Wouter handles the storefront routes so the app preserves the original multi-page information architecture inside one Vite artifact.

## Product

- Home page introduces the label and featured pieces.
- Shop page supports category, color, and sort filters.
- Product pages support color, size, quantity, front/back/detail views, and related pieces.
- Bag drawer persists items, supports quantity changes and shipping progress, and provides a checkout handoff point.
- About and Contact pages explain the label and provide validated customer support/newsletter forms.

## User preferences

None recorded.

## Gotchas

- Checkout, email delivery, and newsletter delivery are intentionally not connected to an external provider yet; the UI surfaces those boundaries rather than pretending a transaction or message was sent.
- Keep `BASE_PATH` and `PORT` workflow-provided when running the Vite artifact.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
