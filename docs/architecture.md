# Architecture

## Stack

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework | Nuxt 4 | `^4.3.1` |
| Runtime serveur | Nitro (intégré) | — |
| UI | Vue 3 | `^3.5` |
| CSS | Tailwind CSS v4 | `^4.2` via `@tailwindcss/vite` |
| Composants | shadcn-nuxt + radix-vue | manuel, pas de module auto |
| Icônes | lucide-vue-next | `^0.575` |
| ORM | Drizzle ORM | `^0.45` |
| SQLite driver | better-sqlite3 | `^12.6` (module natif, nécessite node-gyp) |
| Package manager | pnpm | — |

## Structure des dossiers

```
mouviz/
├── app/                        # srcDir Nuxt 4 — alias ~/
│   ├── assets/css/tailwind.css # Tailwind v4 + CSS vars design tokens
│   ├── components/             # Composants réutilisables
│   │   ├── ActivityItem.vue
│   │   ├── GenrePill.vue
│   │   ├── PosterCard.vue
│   │   ├── StarRating.vue
│   │   └── ui/Button.vue       # shadcn-style, CVA variants
│   ├── layouts/default.vue     # Nav sticky (Films / Listes / Journal / Search / Profile)
│   ├── lib/utils.ts            # cn() = clsx + tailwind-merge
│   ├── pages/                  # Routing Nuxt (file-based)
│   │   ├── index.vue
│   │   ├── search.vue
│   │   ├── film/[id].vue
│   │   ├── person/[id].vue
│   │   ├── lists.vue
│   │   ├── lists/[id].vue
│   │   ├── journal.vue
│   │   └── profile/[username].vue
│   └── types/index.ts          # Interfaces TypeScript côté client
├── server/
│   ├── api/                    # Routes Nitro auto-découvertes
│   ├── database/
│   │   ├── schema.ts           # Schéma Drizzle (source de vérité)
│   │   └── migrations/         # SQL généré par drizzle-kit
│   └── utils/
│       ├── db.ts               # useDB() — singleton Drizzle, auto-importé Nitro
│       └── tmdb.ts             # tmdbImage + tmdbFetch throttlé
├── scripts/seed.ts             # Peuplement DB depuis TMDB
├── db/mouviz.db                # SQLite (gitignorée)
├── drizzle.config.ts
└── nuxt.config.ts
```

## Conventions importantes

### Nuxt 4 et l'alias `~/`

`~/` pointe vers `app/` (srcDir), pas vers la racine du projet. Les imports depuis les pages et composants utilisent `~/types/...`, `~/lib/utils`, etc.

### Requêtes depuis les pages

Toutes les pages fetchent leurs données via `useFetch('/api/...')`. Il n'y a pas de store global — chaque page gère son propre état local.

```vue
<script setup lang="ts">
const { data } = await useFetch('/api/films', { query: { limit: 20 } })
</script>
```

### Utilitaires serveur auto-importés

Nitro auto-importe `server/utils/`. Toutes les routes peuvent appeler `useDB()` et `tmdbImage` sans import explicite.

### Utilisateur courant

L'authentification n'est pas implémentée. Toutes les routes utilisent `CURRENT_USER_ID = 1` (username: `currentuser`). Le profil accessible via `/profile/currentuser`.

### TypeScript — `noUncheckedIndexedAccess`

Nuxt 4 active cette option par défaut dans `.nuxt/tsconfig.json`. L'indexation de tableau retourne `T | undefined` :

```typescript
// ❌ erreur TS
const first = array[0].name

// ✅ correct
const first = array[0]?.name
// ou
const first = array[0]!.name  // si on sait que l'index existe
```

### better-sqlite3 — requêtes synchrones

Drizzle sur better-sqlite3 utilise des requêtes **synchrones**. Les méthodes sont `.all()`, `.get()`, `.run()` (pas de `await`).

```typescript
const film = db.select().from(films).where(eq(films.id, id)).get()  // sync
const all = db.select().from(films).all()  // sync
```

## Design tokens

Définis dans `app/assets/css/tailwind.css` comme CSS custom properties et exposés à Tailwind v4 via `@theme inline`.

| Token CSS | Valeur | Classe Tailwind |
|-----------|--------|-----------------|
| `--background` | `#14181c` | `bg-background` |
| `--card` | `#2c3440` | `bg-card` |
| `--muted` | `#1a1e24` | `bg-muted` |
| `--primary` | `#00e054` | `text-primary`, `bg-primary` |
| `--accent` | `#40bcf4` | `text-accent` |
| `--accent-stars` | `#ff8000` | (inline style) |
| `--muted-foreground` | `#99aabb` | `text-muted-foreground` |
| `--border` | `#445566` | `border-border` |

## Composants

### `PosterCard`
Carte film avec poster, titre, année, note. Hover : boutons d'action (vu / aimé / watchlist). Émet des events vers le parent pour toggler les interactions.

### `StarRating`
Étoiles interactives 0–5 (pas de 0.5). Prop `modelValue`, émet `update:modelValue`.

### `GenrePill`
Badge genre. Prop `name`, émet `click` avec le nom du genre.

### `ActivityItem`
Ligne d'activité : avatar utilisateur, film, type d'action, date relative.

### `Button` (`ui/`)
Variantes CVA : `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Tailles : `default`, `sm`, `lg`, `icon`.
