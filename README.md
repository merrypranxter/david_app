# Machine-Native Prompt Synthesizer (David)

Vite + React front end with a Gemini-backed API.

## Interface architecture

DAVID now uses a workspace shell instead of exposing every subsystem in one permanent vertical stack:

- **Create** – the normal synthesis workbench.
- **Mutate** – opens the Mutation Lab / synthetic ontology controls.
- **Library** – recipes, experiment memory, archives, and glitch tools.
- **Lab** – Discovery, Guidance Geometry, Structural / Relational, Context, and Serialization diagnostics.
- **Simple / Expert** – Simple keeps the quick mutation controls visible while collapsing the large paradox and modular-pipeline surfaces; Expert restores the full machinery.
- **Field Manual** – technical controls are decorated with contextual `?` help. Help entries explain what a control is, what it affects, what it is best for, how to use it, and important gotchas.

The UI palette is centralized in `src/index.css` and uses black/white/gray plus acid yellow, electric purple, orange, hot pink, neon green, and cyan accents. `Anatol MN` is referenced as the DAVID display/header font with safe fallbacks; the font binary itself is intentionally not bundled in the repository.

## How the API is served

The UI calls `POST /api/synthesize` and `POST /api/simulate-target`. The same logic
lives in one place (`lib/david.ts`) and is exposed by two different runtimes:

| Environment            | Runtime                                   |
| ---------------------- | ----------------------------------------- |
| AI Studio / local dev  | Express server in `server.ts` (`npm run dev`) |
| Netlify                | Functions in `netlify/functions/`, routed by `netlify.toml` |

Netlify does not run `server.ts`; it only publishes the static Vite build plus
serverless functions. Without `netlify.toml` and the functions, `/api/*` falls
through to the SPA fallback and returns HTML, so the Synthesize button appears to
do nothing.

## Required configuration

Set `GEMINI_API_KEY` in the environment:

- Local: copy `.env.example` to `.env` and fill it in.
- Netlify: Site configuration → Environment variables → `GEMINI_API_KEY`, then redeploy.

`GET /api/health` reports `apiKeyConfigured` so you can verify the deploy quickly.

## Scripts

- `npm run dev` – Express + Vite middleware on port 3000
- `npm run build` – Vite build (`dist/`) + bundled Express server (`dist/server.cjs`)
- `npm run lint` – TypeScript typecheck
