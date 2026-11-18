# The Ink Home — Testing & Verification

## Commands

| Command | What it runs |
| --- | --- |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | `vitest` |
| `npm run build` | `vite build` |
| `npm run dev` | Express + Vite dev server |

## Type checking

`npm run lint` runs `tsc --noEmit` over `src`, `api`, root `*.ts`.

`@types/react` and `@types/react-dom` are installed, so React JSX is now genuinely type-checked.

## Tests

Two suites currently exist and pass (15 tests total):

- `src/lib/api-server.test.ts` — RSS parsing, transform, hashing, constants.
- `src/lib/format.test.ts` — date formatting, reading time, initials, hashing, strip HTML, categories.

```bash
npx vitest run
```

## Build

```bash
npm run build
```

Output is written to `dist/`.

## Manual smoke checks

1. `npm run dev`, then:
   - `GET /api/health` → `200`
   - `GET /api/stories` → `200`, array of stories
   - `GET /api/about` → `200`
   - `POST /api/ai` → `503` when `GROQ_API_KEY` is unset, `200` with a reply when set
   - `GET /` → `200` SPA
2. Native ESM import check for the serverless graph:

```bash
node --input-type=module -e "await import('/abs/path/api/stories.ts')"
```

Extension-less relative imports and value imports of TypeScript-only types must be avoided in
`api/*` and `src/lib/*` server modules.
