# Code style
- Arrow functions only — no `function` declarations
- Before writing any logic, check if it already exists in the codebase — reuse, don't duplicate

# Nuxt 4 specifics
- `~/` resolves to `app/` (srcDir)
- Don't manually import Nuxt auto-imports (`ref`, `computed`, `useFetch`, `useRoute`, `useUserSession`, etc.)
- `noUncheckedIndexedAccess` is enabled — array access returns `T | undefined`, use `!` or `?? fallback`
- Shared types in `app/types/index.ts` — don't redefine existing interfaces
- Pure utilities in `app/utils/` (Nuxt auto-imports them)

# Server
- DB via `useDB()` — Drizzle ORM only, no raw SQL
- TMDB via `tmdbFetch()` from `server/utils/tmdb.ts`
- Protected routes: check `getUserSession(event)`, return 401 if unauthenticated
- Errors: `createError({ statusCode, statusMessage })`
- POST/PUT: `await readBody(event)`

# UI
- Check `app/components/` and `app/components/ui/` before creating any component — reuse what exists
- Icons: `lucide-vue-next` only
- Tailwind v4 via `@tailwindcss/vite` — no `tailwind.config.js`, tokens in `app/assets/css/tailwind.css`
- Dynamic classes: `cn()` from `~/lib/utils.ts`

## Design tokens
```
--bg-primary: #14181c  --bg-card: #2c3440   --bg-nav: #1a1e24
--accent-green: #00e054  --accent-stars: #ff8000  --accent-hearts: #40bcf4
--text-secondary: #99aabb  --text-muted: #6c7a89  --border: #445566
```
