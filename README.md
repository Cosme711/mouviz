# MOUVIZ

Plateforme de suivi et découverte de films (Letterboxd-like). Dark theme, données TMDB, stack Nuxt 4 + SQLite.

## Prérequis

- Node.js ≥ 20
- pnpm
- Token TMDB API (gratuit sur [themoviedb.org](https://www.themoviedb.org/settings/api))

## Installation

```bash
pnpm install

# Rebuild du module natif SQLite (nécessaire sur nouvelle machine)
npx node-gyp rebuild --directory node_modules/.pnpm/better-sqlite3*/node_modules/better-sqlite3

cp .env.example .env
# → remplir TMDB_API_TOKEN dans .env

pnpm run db:migrate   # crée db/mouviz.db avec les tables
pnpm run db:seed      # peuple la DB depuis TMDB (~15s)
```

## Développement

```bash
pnpm run dev          # http://localhost:3000
```

## Production

```bash
pnpm run build
pnpm run preview
```

## Base de données

```bash
pnpm run db:generate  # regénérer les migrations après un changement de schéma
pnpm run db:migrate   # appliquer les migrations
pnpm run db:seed      # repeupler depuis TMDB
pnpm run db:studio    # UI Drizzle Studio
```

## Documentation technique

Voir le dossier [`docs/`](./docs/) :

- [`docs/architecture.md`](./docs/architecture.md) — structure du projet, stack, conventions
- [`docs/api.md`](./docs/api.md) — toutes les routes API avec paramètres et réponses
- [`docs/database.md`](./docs/database.md) — schéma complet, relations, notes ORM
